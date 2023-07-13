const https = require('https');
const querystring = require('querystring');

let DEBUG_FLAG = false;


/**
 * Trys to create a float from a variable of unknown type.
 * 
 * @param {any} x Unknown variable that might contain a float.
 */
function tryCreateFloat(x) {
  if (typeof x === 'string') {
    const floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (floatRegex.test(x)) {
      const result = parseFloat(x);
      if (!isNaN(result)) return result;
    }
  }
  return x;
}

/**
 * Trys to create an integer from a variable of unknown type.
 * 
 * @param {any} x Unknown variable that might contain an integer.
 */
function tryCreateInt(x) {
  if (typeof x === 'string') {
    if ([...x].every(c => '0123456789'.includes(c))) {
      x = parseInt(x);
    }
  }
  return x;
}

/**
 * Trys to create a boolean from a variable of unknown type.
 *
 * @param {any} x Unknown variable that might contain a boolean.
 */
function tryCreateBool(x) {
  if (x === '1' || x === 1 || x === 'yes' || x === 'true') {
    return true;
  }
  if (x === '0' || x === 0 || x === 'no' || x === 'false') {
    return false;
  }
  return x;
}

/**
 * Trys to create a JS Date from a variable of unknown type.
 *
 * @param {any} x Unknown variable that might contain a date.
 */
function tryCreateDate(x) {
  if (x === null || x === undefined) return x;
  x = tryCreateInt(x);
  if (typeof x === 'number') {
    if (x < 99999999999) { // 99,999,999,999 or 100 billion minus 1
      // convert from seconds to milliseconds
      x *= 1000;
    }
  }
  try {
    const ret = new Date(x);
    if (isNaN(ret)) return x;
    return ret;
  } catch (e) {
    return x;
  }
}

/**
 * Construct an object with lat and lon keys from a variable of unknown type.
 * 
 * @param {any} x 
 */
function findLatLonFromVariable(x) {
  const latMin = -90;
  const latMax = 90;
  const lonMin = -180;
  const lonMax = 180;
  const type = typeof x;
  let lat, lon;
  if (type === 'object') {
    if (x.constructor && x.constructor === Array) {
      if (x.length === 2) {
        const a = x[0];
        const b = x[1];

        if (a > latMax || a < latMin) {
          lon = a;
          lat = b;
        } else {
          lat = a;
          lon = b;
        }
        return { lat, lon };
      } else if (x.length === 1) {
        return findLatLonFromVariable(x[0]);
      } else {
        throw new Error('Unable to parse coordinates');
      }
    } else if (x.constructor === Object) {
      if (x.lat) lat = x.lat;
      if (x.latitude) lat = x.latitude;
      if (x.y) lat = x.y;

      if (x.lon) lon = x.lon;
      if (x.longitude) lon = x.longitude;
      if (x.lng) lon = x.lng;
      if (x.long) lon = x.long;
      if (x.x) lon = x.x;

      if (lat === undefined) {
        throw new Error('Unable to find latitude from coordinates');
      }
      if (lon === undefined) {
        throw new Error('Unable to find longitude from coordinates');
      }
      return { lat, lon };
    }
  }
  throw new Error('Unable to parse coordinates');
}

class life360_helper {
  /**
   * Should be only used internally. Creates a helper object that will allow for communication with the Life360 API.
   * @param {life360} api 
   * @param {object} [props]
   */
  constructor(api) {
      if (api === undefined || !(api instanceof life360)) {
        throw new Error('First argument must be an instance of life360!');
      }
      this.api = api;
      this.request = api.request.bind(this.api);
    }
    *[Symbol.iterator]() {
      if (this.length === undefined) {
        throw new Error('This object can not be iterated on!');
      }
      for (let i = 0, len = this.length; i < len; i++) {
        yield this[i];
      }
    }
  clearChildren() {
    for (let i = 0, len = this.length; i < len; i++) {
      this[i] = undefined;
    }
    this.length = 0;
  }
  addChild(child) {
    if (this.length === undefined) {
      this.length = 0;
    }
    this[this.length] = child;
    this.length++;
    return child;
  }
}

/**
 * Represents a Life360 Location Request.
 * 
 * Use the check() method to ask the server for the status of the request.
 */
class life360_location_request extends life360_helper {
  populate(x) {
    Object.assign(this, x);

    this.requestId = x.requestId;
    this.isPollable = x.isPollable;
  }
  async check() {
    const json = await this.request('/v3/circles/members/request/' + this.requestId);
    if (json.status === 'A') {
      this.location = new life360_location(this.api);
      this.location.populate(json.location);
      this.success_response = json;
      return true;
    }
    return false;
  }
}

class life360_checkin_request extends life360_helper {
  populate(x) {
    Object.assign(this, x);

    this.requestId = x.requestId;
    this.isPollable = x.isPollable;
  }
  async check() {
    // TODO: Figure out why this is returning the following.
    /*
      {
        "errorMessage": "Unable to find request",
        "url": "/v3/circles/members/request/REQUEST_GUID_HIDDEN",
        "status": 400
      }
    */
    this.json = await this.request('/v3/circles/members/request/' + this.requestId);
    if (json.status === 'A') {
      this.location = json.location;
      this.success_response = json;
      return true;
    }
    return false;
  }
}

class life360_circle extends life360_helper {
  populate(x) {
    /**
     * id, color, name, type
     */
    Object.assign(this, x);

    this.createdAt = tryCreateDate(x.createdAt);
    this.memberCount = tryCreateInt(x.memberCount);
    this.unreadMessages = tryCreateInt(x.unreadMessages);
    this.unreadNotifications = tryCreateInt(x.unreadNotifications);

    if (x.features instanceof Object) {
      if (x.features.premium !== undefined) {
        x.features.premium = tryCreateInt(x.features.premium);
        x.features.priceMonth = tryCreateInt(x.features.priceMonth);
        x.features.priceYear = tryCreateInt(x.features.priceYear);
      }
      this.features = x.features;
    }

    this.members = new life360_member_list(this.api);
    this.members.circle = this;
    if (x.members) {
      this.members.populate(x.members);
    }
  }
  async refresh() {
    const json = await this.request('/v3/circles/' + this.id);
    this.populate(json);
    return this;
  }


  async allPlaces() {
    const json = await this.request('/v3/circles/' + this.id + '/allplaces');
    // todo: return life360_place_list
    const places = new life360_place_list(this);
    places.populate(json.places);
    return places;
  }
  async code() {
    if (global.DEBUG_FLAG === false) throw 'not implemented';
    const json = await this.request('/v3/circles/' + this.id + '/code');
    return json;
  }
  async emergencycontacts() {
    if (global.DEBUG_FLAG === false) throw 'not implemented';
    const json = await this.request('/v3/circles/' + this.id + '/emergencyContacts');
    const emergencyContacts = json.emergencyContacts; // array
    for (const emergencyContact of emergencyContacts) {
      debugger;
    }
    debugger;
    return json;
  }
  async member(member_id) {
    const json = await this.request('/v3/circles/' + this.id + '/members/' + member_id);
    debugger;
    return json;
  }
  async memberAlerts() {
    const json = await this.request('/v3/circles/' + this.id + '/member/alerts');
    debugger;
    return json;
  }
  async memberPreferences() {
    const json = await this.request('/v3/circles/' + this.id + '/member/preferences');
    debugger;
    return json;
  }


  async membersHistory(since) {
    let params;
    if (since !== undefined) {
      if (since instanceof Date) {
        since = Math.floor(a.getTime() / 1000);
      } else if (typeof since === 'string') {
        since = Math.floor((new Date(since)).getTime() / 1000);
      }
      params = { since };
    }
    const json = await this.request('/v3/circles/' + this.id + '/members/history', { params });
    const locations = new life360_location_list(this.api);
    for (let i = 0; i < json.locations.length; i++) {
      const location = new life360_location(this.api);
      location.populate(json[i].locations);
      locations.addChild(location);
    }
    return locations;
  }
  async listMembers() {
    const json = await this.request('/v3/circles/' + this.id + '/members');
    this.members = new life360_member_list(this.api);
    this.members.circle = this;
    this.members.populate(json.members);
    return this.members;
  }
  async listMessages(count) {
    let params;
    if (count !== undefined) params = { count };
    const json = await this.request('/v3/circles/' + this.id + '/messages', {
      params,
    });
    debugger;
    return json;
  }
  async listNearbyplaces(lat, lon, wifiscan) {
    let params;
    if (wifiscan !== undefined) {
      params = { wifiscan: wifiscan };
    }
    const json = await this.request('/v3/circles/' + this.id + '/nearbyplaces/' + lat + '/' + lon);
    // todo: return life360_place_list
    debugger;
    return json;
  }
  async listPlaces() {
    const json = await this.request('/v3/circles/' + this.id + '/places');
    // todo: return life360_place_list
    debugger;
    return json;
  }
  async watchlist() {
    if (global.DEBUG_FLAG === false) throw 'not implemented';
    const json = await this.request('/v3/circles/' + this.id + '/driverbehavior/watchlist');
    debugger;
    /*
      {
        "watchlist": [],
        "sdkEnabled": {
          "4e7f416b-ae08-40c9-be78-03fe0adcadae": "OFF",
          "bfc4a9d2-639e-49bd-b7a1-f6a3356a7b18": "OFF"
        }
      }
    */
    return json;
  }

  async setCode(code) {
    const json = await this.request('/v3/circles/' + this.id + '/code', {
      method: 'post',
    });
    debugger;
    return json;
  }
  async startSmartRealTime() {
    const json = await this.request('/v3/circles/' + this.id + '/smartRealTime/start', {
      method: 'post',
    });
    debugger;
    return json;
  }
  async sendMessage() {
    const json = await this.request('/v3/circles/' + this.id + '/threads/message', {
      method: 'post',
    });
    debugger;
    return json;
  }
}
class life360_circle_list extends life360_helper {
  populate(x) {
    for (let i = 0; i < x.circles.length; i++) {
      const circle = new life360_circle(this.api);
      circle.populate(x.circles[i]);
      this.addChild(circle);
    }
  }
  findById(id) {
    for (const circle of this) {
      if (circle.id === id) {
        return circle;
      }
    }
  }
  findByName(name) {
    const regex = new RegExp('.*' + name + '.*', 'i');
    for (const circle of this) {
      if (circle.name.match(regex)) {
        return circle;
      }
    }
  }
}

class life360_crime extends life360_helper {
  populate(x) {
    Object.assign(this, x);

    this.incidentDate = tryCreateDate(x.incidentDate);
    this.incident_date = tryCreateDate(x.incident_date);

    this.latitude = tryCreateFloat(x.latitude);
    this.longitude = tryCreateFloat(x.longitude);

    this.id = tryCreateInt(x.id);
  }
}
class life360_crime_list extends life360_helper {}

class life360_offender extends life360_helper {
  populate(x) {
    Object.assign(this, x);

    this.age = tryCreateInt(x.age);
    this.latitude = tryCreateFloat(x.latitude);
    this.longitude = tryCreateFloat(x.longitude);
    this.weight = tryCreateInt(x.weight);
  }
}

class life360_offender_list extends life360_helper {}

class life360_safetypoint extends life360_helper {
  populate(x) {
    Object.assign(this, x);

    this.incidentDate = tryCreateDate(x.incidentDate);
    this.incident_date = tryCreateDate(x.incident_date);

    this.latitude = tryCreateFloat(x.latitude);
    this.longitude = tryCreateFloat(x.longitude);

    this.id = tryCreateInt(x.id);
  }
}
class life360_safetypoint_list extends life360_helper {}

class life360_location extends life360_helper {
  populate(x) {
    Object.assign(this, x);
    /**
     * address1, address2, driveSDKStatus, lat, lon, name, placeType
     * shortAddress, source, sourceId, tripId, userActivity
     */

    this.startTimestamp = tryCreateDate(x.startTimestamp);
    this.endTimestamp = tryCreateDate(x.endTimestamp);
    this.since = tryCreateDate(x.since);
    this.timestamp = tryCreateDate(x.timestamp);

    this.accuracy = tryCreateInt(x.accuracy);
    this.battery = tryCreateInt(x.battery);
    this.charge = tryCreateInt(x.charge);
    this.speed = tryCreateInt(x.speed);

    this.inTransit = tryCreateBool(x.inTransit);
    this.isDriving = tryCreateBool(x.isDriving);
    this.wifiState = tryCreateBool(x.wifiState);
  }
}
class life360_location_list extends life360_helper {}

class life360_member extends life360_helper {
  populate(x) {
    /**
     * id, activity, avatar, avatarAuthor, cobranding, communications
     * firstName, issues, langauge, lastName, locale, loginEmail, loginPhone
     * medical, pinNumber, relation
     */
    Object.assign(this, x);

    this.created = tryCreateDate(x.created);
    this.createdAt = tryCreateDate(x.createdAt);

    this.isAdmin = tryCreateBool(x.isAdmin);
    if (x.location) {
      this.location = new life360_location(this.api);
      this.location.populate(x.location);
    }

    if (x.settings) {
      /*
      settings = {
        alerts: {
          crime: bool,
          sound: bool,
        },
        dateFormat: string,
        locale: string,
        map: {
          advisor: bool,
          crime: bool,
          crimeDuration: string,
          family: bool,
          fire: bool,
          hospital: bool,
          memberRadius: bool,
          placeRadius: bool,
          police: bool,
          sexOffenders: bool,
        },
        timeZone: string,
        unitOfMeasure: string,
        zendrive: {
          sdk_enabled: string
        }
      }
      */
      if (x.settings.alerts) {
        x.settings.alerts.crime = tryCreateBool(x.settings.alerts.crime);
        x.settings.alerts.sound = tryCreateBool(x.settings.alerts.sound);
      }
      if (x.settings.map) {
        x.settings.map.advisor = tryCreateBool(x.settings.map.advisor);
        x.settings.map.crime = tryCreateBool(x.settings.map.crime);
        x.settings.map.crimeDuration = tryCreateBool(x.settings.map.crimeDuration);
        x.settings.map.family = tryCreateBool(x.settings.map.family);
        x.settings.map.fire = tryCreateBool(x.settings.map.fire);
        x.settings.map.hospital = tryCreateBool(x.settings.map.hospital);
        x.settings.map.memberRadius = tryCreateBool(x.settings.map.memberRadius);
        x.settings.map.placeRadius = tryCreateBool(x.settings.map.placeRadius);
        x.settings.map.police = tryCreateBool(x.settings.map.police);
        x.settings.map.sexOffenders = tryCreateBool(x.settings.map.sexOffenders);
      }
      this.settings = x.settings;
    }

    if (x.issues) {
      x.issues.disconnected = tryCreateBool(x.issues.disconnected);
      x.issues.troubleshooting = tryCreateBool(x.issues.troubleshooting);
      this.issues = x.issues;
    }

    if (x.features !== undefined) {
      this.features = {};
      const keys = [
        'device', 'disconnected', 'geofencing', 'mapDisplay',
        'nonSmartphoneLocating', 'pendingInvite', 'shareLocation',
        'smartphone'
      ];
      keys.forEach(key => {
        if (x.features[key] !== undefined) this.features[key] = tryCreateBool(x.features[key]);
      });
      if (x.features.shareOffTimestamp !== undefined) this.features.shareOffTimestamp = tryCreateDate(x.features.shareOffTimestamp);
    }
  }
  async refresh() {
    const json = await this.api.member(this.circle.id, this.id);
    this.populate(json);
    return this;
  }
  async history(time) {
    let params;
    if (time !== undefined) {
      if (time instanceof Date) {
        time = Math.floor(a.getTime() / 1000);
      } else if (typeof time === 'string') {
        time = Math.floor((new Date(time)).getTime() / 1000);
      }
      params = { time: time };
    }
    const json = await this.request('/v3/circles/' + this.circle.id + '/members/' + this.id + '/history', { params });
    const locations = new life360_location_list(this.api);
    for (let i = 0; i < json.locations.length; i++) {
      const location = new life360_location(this.api);
      location.populate(json.locations[i]);
      locations.addChild(location);
    }
    return locations;
  }
  async requestLocation() {
    const json = await this.request('/v3/circles/' + this.circle.id + '/members/' + this.id + '/request', {
      method: 'post',
      body: {
        type: 'location',
      },
    });
    const request = new life360_location_request(this.api);
    request.populate(json);
    request.member = this;
    request.circle = this.circle;
    return request;
  }
  async requestCheckIn() {
    const json = await this.request('/v3/circles/' + this.circle.id + '/members/' + this.id + '/request', {
      method: 'post',
      body: {
        type: 'checkin',
      },
    });
    const request = new life360_checkin_request(this.api);
    request.populate(json);
    request.member = this;
    request.circle = this.circle;
    return request;
  }
}
class life360_member_list extends life360_helper {
  populate(x) {
    for (let i = 0; i < x.length; i++) {
      const member = new life360_member(this.api);
      member.populate(x[i]);
      member.circle = this;
      this.addChild(member);
    }
  }
  findById(id) {
    for (const member of this) {
      if (member.id === id) {
        return member;
      }
    }
  }
  findByName(name) {
    const regex = new RegExp('.*' + name + '.*', 'i');
    for (const member of this) {
      if (member.firstName.match(regex)) {
        return member;
      }
      if (member.lastName.match(regex)) {
        return member;
      }
      const fullName = member.firstName + ' ' + member.lastName;
      if (fullName.match(regex)) {
        return member;
      }
    }
  }
}

class life360_message extends life360_helper {}

class life360_place extends life360_helper {}

class life360_thread extends life360_helper {}

class life360_session extends life360_helper {
  populate(x) {
    Object.assign(this, x);

    this.token_type = x.token_type;
    this.access_token = x.access_token;
  }
}

class life360 {
  /**
   * @returns life360
   */
  static login() {
    if (this._instance === undefined) this._instance = new life360();
    return this._instance.login.apply(this._instance, arguments);
  }
  static logout() {
    if (this._instance === undefined) this._instance = new life360();
    return this._instance.logout.apply(this._instance, arguments);
  }
  static crimes() {
    if (this._instance === undefined) this._instance = new life360();
    return this._instance.listCrimes.apply(this._instance, arguments);
  }
  static me() {
    if (this._instance === undefined) this._instance = new life360();
    return this._instance.me.apply(this._instance, arguments);
  }
  static circles() {
    if (this._instance === undefined) this._instance = new life360();
    return this._instance.listCircles.apply(this._instance, arguments);
  }
  static safetyPoints() {
    if (this._instance === undefined) this._instance = new life360();
    return this._instance.listSafetyPoints.apply(this._instance, arguments);
  }
  static offenders() {
    if (this._instance === undefined) this._instance = new life360();
    return this._instance.offenders.apply(this._instance, arguments);
  }
  constructor() {
    this.BASIC_AUTH = 'Basic U3dlcUFOQWdFVkVoVWt1cGVjcmVrYXN0ZXFhVGVXckFTV2E1dXN3MzpXMnZBV3JlY2hhUHJlZGFoVVJhZ1VYYWZyQW5hbWVqdQ==';
    this.defaults = {
      hostname: 'api-cloudfront.life360.com',
      headers: {
        Accept: 'application/json',
        'X-Application': 'life360-web-client',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
      },
    };
  }
  enableDebugging() {
    global.DEBUG_FLAG = true;
  }
  disableDebugging() {
    global.DEBUG_FLAG = false;
  }
  _getDeviceId() {
    if (this._deviceId === undefined) {
      const bytes = Buffer.alloc(8);
      for (let i = 0; i < 8; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      this._deviceId = bytes.toString('hex');
    }
    return this._deviceId;
  }
  /**
   * Asks Life360.com to login a user.
   */
  async login() {
    const body = {
      countryCode: 1,
      password: '',
      username: '',
      phone: '',
      grant_type: 'password',
    };
    if (arguments.length === 0) {
      throw new Error('Must provide an argument to life360.login');
    } else if (arguments.length === 1) {
      let arg = arguments[0];
      if (typeof arg === 'object') {
        if (arg.username !== undefined) body.username = arg.username;
        if (arg.user !== undefined) body.username = arg.user;
        if (arg.email !== undefined) body.username = arg.email;

        if (arg.phone !== undefined) body.phone = arg.phone;

        if (arg.password !== undefined) body.password = arg.password;
        if (arg.pass !== undefined) body.password = arg.pass;
      } else {
        throw new Error('First and only argument must be an object');
      }
    } else if (arguments.length === 2) {
      let arg1 = arguments[0];
      let arg2 = arguments[1];
      if (typeof arg1 === 'string') {
        let emailRegex = /^[^@]+@[^\.]+$/;
        if (arg1.match(emailRegex)) {
          body.username = arg1;
        } else {
          let phoneRegex = /^[0-9()-+ #\.]+$/;
          if (arg1.match(phoneRegex)) {
            body.phone = arg1;
          } else {
            body.username = arg1;
          }
        }
      }
      if (typeof arg2 === 'string') {
        body.password = arg2;
      } else {
        throw new Error('Second argument must be a password string');
      }
    }
    const json = await this.request('/v3/oauth2/token', {
      authorization: this.BASIC_AUTH,
      body: body,
      headers: {
        'X-Device-Id': this._getDeviceId(),
      }
    });
    let token_type = json.token_type;
    if (!token_type) token_type = 'Bearer';
    this.session = new life360_session(this);
    this.session.populate(json);
    return this;
  }
  async logout() {
    if (this.session) {
      let access_token = this.session.access_token;
      let token_type = this.session.token_type;
      if (global.DEBUG_FLAG === false) throw 'not implemented';
      debugger;
      this.session = undefined;
    } else {
      throw new Error('Not logged in.');
    }
  }
  async putLocation(data) {
    const geolocation = {};
    const geolocationMetadata = {};
    const device = {};

    if (data.lat) geolocation.lat = data.lat;
    if (data.lon) geolocation.lon = data.lon;
    if (data.alt) geolocation.alt = data.alt;
    if (data.accuracy) geolocation.accuracy = data.accuracy;
    if (data.heading) geolocation.heading = data.heading;
    if (data.speed) geolocation.speed = data.speed;
    if (data.timestamp) geolocation.timestamp = data.timestamp;
    if (data.age) geolocation.age = data.age;

    if (data.wssid) geolocationMetadata.wssid = data.wssid;
    if (data.reqssid) geolocationMetadata.reqssid = data.reqssid;
    if (data.lmode) geolocationMetadata.lmode = data.lmode;

    if (data.battery) device.battery = data.battery;
    if (data.charge) device.charge = data.charge;
    if (data.wifiState) device.wifi_state = data.wifiState;
    if (data.build) device.build = data.build;

    /* Make the inputs conform to the life360's api. */

    if (geolocation.alt === undefined) geolocation.alt = '0.0';
    if (geolocation.accuracy === undefined) geolocation.accuracy = '10.00';
    if (geolocation.heading === undefined) geolocation.heading = '0.0';
    if (geolocation.speed === undefined) geolocation.speed = '0.0';
    if (geolocation.timestamp === undefined) {
      const nowInSeconds = Math.floor(new Date().getTime() / 1000);
      geolocation.timestamp = nowInSeconds + '';
    }

    if (device.build === undefined) device.build = '228980';
    if (device.driveSDKStatus === undefined) device.driveSDKStatus = 'OFF';
    if (device.userActivity === undefined) device.userActivity = 'unknown';

    /* Change types of all properties to strings */

    if (typeof geolocation.lat === 'number') geolocation.lat = geolocation.lat + ''
    if (typeof geolocation.lon === 'number') geolocation.lon = geolocation.lon + ''

    const userContext = {
      geolocation: geolocation,
      geolocation_meta: geolocationMetadata,
      device: device
    };
    const userContextBase64 = Buffer.from(JSON.stringify(userContext)).toString('base64');
    const json = await this.request('/v4/locations', {
      hostname: 'android.life360.com',
      method: 'put',
      headers: {
        'X-Device-ID': this._getDeviceId(),
        'X-UserContext': userContextBase64,
      }
    });
    return json;
  }
  async listCrimes(args) {
    const params = {};
    if (args) {
      if (args.start) params.startDate = args.start;
      if (args.end) params.endDate = args.end;
      if (args.page) params.page = args.page;
      if (args.pageSize) params.pageSize = args.pageSize;
      if (args.topLeft) {
        const topLeftLatLon = findLatLonFromVariable(args.topLeft);
        params['boundingBox[topLeftLatitude]'] = topLeftLatLon.lat;
        params['boundingBox[topLeftLongitude]'] = topLeftLatLon.lon;
      }
      if (args.bottomRight) {
        const bottomRightLatLon = findLatLonFromVariable(args.bottomRight);
        params['boundingBox[bottomRightLatitude]'] = bottomRightLatLon.lat;
        params['boundingBox[bottomRightLongitude]'] = bottomRightLatLon.lon;
      }
      if (args.topLeftLat) params['boundingBox[topLeftLatitude]'] = args.topLeftLat;
      if (args.topLeftLon) params['boundingBox[topLeftLongitude]'] = args.topLeftLon;
      if (args.bottomRightLat) params['boundingBox[bottomRightLatitude]'] = args.bottomRightLat;
      if (args.bottomRightLon) params['boundingBox[bottomRightLongitude]'] = args.bottomRightLon;
    }
    if (params.startDate instanceof Date) {
      params.startDate = Math.floor(params.startDate.getTime() / 1000);
    }
    if (params.endDate instanceof Date) {
      params.endDate = Math.floor(params.endDate.getTime() / 1000);
    }
    const json = await this.request('/v3/crimes', { params });
    const crimes = new life360_crime_list(this);
    for (let i = 0; i < json.crimes.length; i++) {
      const crime = new life360_crime(this);
      crime.populate(json.crimes[i]);
      crimes.addChild(crime);
    }
    return crimes;
  }
  async me() {
    const json = await this.request('/v3/users/me');
    this._me = new life360_member(this);
    this._me.populate(json);
    return this._me;
  }
  async listCircles() {
    const json = await this.request('/v3/circles');
    this._circles = new life360_circle_list(this);
    this._circles.populate(json);
    return this._circles;
  }
  async listSafetyPoints() {
    const params = {};
    const args = arguments;
    if (args.length === 1) {
      const latLon = findLatLonFromVariable(args[0]);
      params['centerPoint[latitude]'] = latLon.lat;
      params['centerPoint[longitude]'] = latLon.lon;
    } else if (args.length === 2) {
      params['centerPoint[latitude]'] = args[0];
      params['centerPoint[longitude]'] = args[1];
    }
    const json = await this.request('/v3/safetyPoints', { params });
    const locations = new life360_safetypoint_list(this);
    for (let i = 0; i < json.safetyPoints.length; i++) {
      const location = new life360_safetypoint(this);
      location.populate(json.safetyPoints[i]);
      location.locationType = 'safetyPoint';
      locations.addChild(location);
    }
    return locations;
  }
  async listOffenders(args) {
    const params = {};
    if (args) {
      if (args.limit) params['limit'] = args.limit;
      if (args.topLeft) {
        const topLeftLatLon = findLatLonFromVariable(args.topLeft);
        params['boundingBox[topLeftLatitude]'] = topLeftLatLon.lat;
        params['boundingBox[topLeftLongitude]'] = topLeftLatLon.lon;
      }
      if (args.bottomRight) {
        const bottomRightLatLon = findLatLonFromVariable(args.bottomRight);
        params['boundingBox[bottomRightLatitude]'] = bottomRightLatLon.lat;
        params['boundingBox[bottomRightLongitude]'] = bottomRightLatLon.lon;
      }
      if (args.topLeftLat) params['boundingBox[topLeftLatitude]'] = args.topLeftLat;
      if (args.topLeftLon) params['boundingBox[topLeftLongitude]'] = args.topLeftLon;
      if (args.bottomRightLat) params['boundingBox[bottomRightLatitude]'] = args.bottomRightLat;
      if (args.bottomRightLon) params['boundingBox[bottomRightLongitude]'] = args.bottomRightLon;
    }
    const json = await this.request('/v3/offenders', { params });
    const offenders = new life360_offender_list(this);
    for (let i = 0; i < json.offenders.length; i++) {
      const offender = new life360_offender(this);
      offender.populate(json.offenders[i]);
      offenders.addChild(offender);
    }
    return offenders;
  }
  request(a, b) {
    let options;
    if (b === undefined) {
      if (typeof a === 'string') {
        options = { path: a };
      }
    } else {
      options = b;
      options.path = a;
    }
    const self = this;

    function findHeaderCaseInsensitive(name, headers) {
      const keys = Object.keys(headers);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key.localeCompare(name, self.locale, { sensitivity: 'base' }) === 0) {
          return headers[key];
        }
      }
    }

    let hostname = this.defaults.hostname;
    let path = this.defaults.path;
    let encoding = this.defaults.encoding;
    let headers = {};
    let body = this.defaults.body;
    let type = this.defaults.type;
    let method = this.defaults.method;
    let params = this.defaults.params;
    if (options.hostname) {
      hostname = options.hostname;
    }
    if (options.path) {
      path = options.path;
    } else {
      path = '/';
    }
    if (this.defaults.headers) {
      const keys = Object.keys(this.defaults.headers);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = this.defaults.headers[key];
        headers[key] = value;
      }
    }
    if (options.params) {
      params = options.params;
      if (typeof params === 'object') {
        params = querystring.stringify(params);
      }
    }
    if (path.length < 1 || path[0] !== '/') {
      path = '/' + path;
    }
    if (options.encoding) {
      encoding = encoding;
    }
    if (typeof headers !== 'object' && headers !== undefined) {
      throw new Error('Default headers is not an object!');
    }
    if (encoding === undefined) {
      encoding = 'utf-8';
    }
    if (options.method) {
      method = options.method.toLocaleUpperCase();
    } else {
      if (options.body) {
        method = 'POST';
      } else {
        method = 'GET';
      }
    }
    if (options.headers) {
      const headersKeys = Object.keys(options.headers);
      for (let i = 0; i < headersKeys.length; i++) {
        headers[headersKeys[i]] = options.headers[headersKeys[i]];
      }
    }
    if (options.body) {
      if (options.type) {
        type = options.type;
      } else {
        type = 'form-urlencoded';
      }
      body = options.body;
      if (type === 'json') {
        body = JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
      } else if (type === 'form-urlencoded') {
        if (typeof body === 'object') {
          body = querystring.stringify(body);
        } else if (typeof body === 'string') {
          // no-op
        } else {
          throw new Error('A url encoded body must be an object!');
        }
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        if (typeof body !== 'string' && !(body instanceof Buffer)) {
          throw new Error('Body must be turned into a string!');
        }
        if (type.indexOf('/') === -1) {
          headers['Content-Type'] = 'application/' + type;
        } else {
          headers['Content-Type'] = type;
        }
      }
      if (!(body instanceof Buffer)) {
        body = Buffer.from(body);
      }
      headers['Content-Length'] = body.byteLength;
    }

    let authorization;
    if (options.auth) {
      authorization = options.auth;
    } else if (options.authorization) {
      authorization = options.authorization;
    } else if (this.session) {
      authorization = this.session.token_type + ' ' + this.session.access_token
    }
    if (authorization) {
      if (typeof authorization === 'string') {
        if (authorization.indexOf(' ') === -1) {
          authorization = 'Basic ' + authorization;
        }
        headers.Authorization = authorization;
      } else if (typeof authorization === 'object') {
        let auth_type;
        let base64_value;
        if (authorization.base64) {
          base64_value = authorization.base64;
        }
        if (authorization.value) {
          base64_value = Buffer.from(authorization.value).toString('base64');
        }
        if (authorization.type) {
          auth_type = authorization.type;
          if (auth_type === 'basic') auth_type = 'Basic';
          if (auth_type === 'bearer') auth_type = 'Bearer';
          if (auth_type === 'digest') auth_type = 'Digest';
        }
        if (auth_type === undefined) {
          auth_type = 'Basic';
        }
        headers.Authorization = auth_type + ' ' + base64_value;
      } else {
        throw new Error('Invalid authorization type!');
      }
    }

    if (params) {
      path += '?' + params;
    }
    const request_options = {
      hostname: hostname,
      path: path,
      method: method,
      headers: headers,
    };
    return new Promise((ok, fail) => {
      let request = https.request(request_options, (res) => {
        //res.setEncoding(encoding);

        let buffer;
        let bodyCharset = encoding;
        let bodyType;

        // Find the server-provided content-type and character set
        const contentTypeHeader = findHeaderCaseInsensitive('content-type', res.headers);
        if (contentTypeHeader !== undefined) {
          const parts = contentTypeHeader.split(';');
          bodyType = parts[0];
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i].split('=');
            if (part[0] === 'charset') {
              if (part.length > 1) {
                bodyCharset = part[1];
              }
            }
          }
        }

        res.on('data', function(chunk) {
          if (buffer === undefined) {
            buffer = chunk;
          } else {
            buffer = Buffer.concat([buffer, chunk]);
          }
        });
        res.on('end', function() {
          try {
            // done reading body

            let body;
            if (buffer) {
              if (bodyType === 'application/json') {
                body = JSON.parse(buffer);
              } else {
                body = Buffer.from(buffer, bodyCharset);
              }
            }

            if (global.DEBUG_FLAG === false && typeof body === 'object' && body.errorMessage !== undefined) {
              return fail(new Error('API responded with a ' + body.errorMessage));
            } else if (res.statusCode !== 200) {
              return fail(new Error('Server responded with a ' + res.statusCode + ', ' + res.statusMessage));
            }

            return ok(body);
          } catch (e) {
            fail(e);
          }
        });
      });
      request.on('error', (e) => { fail(e); });
      if (body) {
        request.write(body);
      }
      request.end();
    });
  }
}

module.exports = life360;
