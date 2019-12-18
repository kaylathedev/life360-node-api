const https = require('https');
const querystring = require('querystring');

let DEBUG_FLAG = false;

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
    var ret = new Date(x);
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
  const latitudeMin = -90;
  const latitudeMax = 90;
  const longitudeMin = -180;
  const longitudeMax = 180;
  var type = typeof x;
  var lat, lon;
  if (type === 'object') {
    if (x.constructor && x.constructor === Array) {
      if (x.length === 2) {
        var a = x[0];
        var b = x[1];

        throw new Error('not implemented');

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
      return { lat: lat, lon: lon };
    }
  }
  throw new Error('Unable to parse coordinates');
}

class life360_api_helper {
  /**
   * Should be only used internally. Creates a helper object that will allow for communication with the Life360 API.
   * @param {life360} api 
   * @param {object} [props]
   */
  constructor(api, props) {
    if (api === undefined || !(api instanceof life360)) {
      throw new Error('First argument must be an instance of life360!');
    }
    this.api = api;
    this.request = api.request.bind(this.api);
    if (props !== undefined) {
      Object.assign(this, props);
    }
    if (this._fix !== undefined) {
      this._fix();
    }
  }
  *[Symbol.iterator]() {
    if (this.length === undefined) {
      throw new Error('This object can not be iterated on!');
    }
    for (var i = 0, len = this.length; i < len; i++) {
      yield this[i];
    }
  }
  clearChildren() {
    for (var i = 0, len = this.length; i < len; i++) {
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
class life360_location_request extends life360_api_helper {
  constructor(api, props) {
    super(api, props);
    this.requestId = props.requestId;
    this.isPollable = props.isPollable;
  }
  getLocation() {
    if (this.location !== undefined) return this.location;
  }
  async check() {
    var json = await this.request('/v3/circles/members/request/' + this.requestId);
    if (json.status === 'A') {
      this.location = new life360_location(json.location);
      this.success_response = json;
      return true;
    }
    return false;
  }
}

class life360_checkin_request extends life360_api_helper {
  constructor(api, props) {
    super(api, props);
    this.requestId = props.requestId;
    this.isPollable = props.isPollable;
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

class life360_circle extends life360_api_helper {
  _fix() {
    if (this.members && !(this.members instanceof life360_member_list)) {
      var members = new life360_member_list(this.api);
      members.circle = this;
      for (var i = 0; i < this.members.length; i++) {
        var child = members.addChild(new life360_member(this.members[i]));
        child.circle = this;
      }
      this.members = members;
    }
  }
  async refresh() {
    var json = await this.request('/v3/circles/' + this.id);
    this._fix(json);
    return this;
  }


  async allPlaces() {
    var json = await this.request('/v3/circles/' + this.id + '/allplaces');
    // todo: return life360_place_list
    return new life360_place_list(this, json.places);
  }
  async code() {
    if (global.DEBUG_FLAG === false) throw 'not implemented';
    var json = await this.request('/v3/circles/' + this.id + '/code');
    return json;
  }
  async emergencyContacts() {
    if (global.DEBUG_FLAG === false) throw 'not implemented';
    var json = await this.request('/v3/circles/' + this.id + '/emergencyContacts');
    var emergencyContacts = json.emergencyContacts; // array
    for (var emergencyContact of emergencyContacts) {
      debugger;
    }
    debugger;
    return json;
  }
  async member(member_id) {
    var json = await this.request('/v3/circles/' + this.id + '/members/' + member_id);
    debugger;
    return json;
  }
  async memberAlerts() {
    var json = await this.request('/v3/circles/' + this.id + '/member/alerts');
    debugger;
    return json;
  }
  async memberPreferences() {
    var json = await this.request('/v3/circles/' + this.id + '/member/preferences');
    debugger;
    return json;
  }


  async membersHistory(since) {
    var params;
    if (since !== undefined) {
      if (since instanceof Date) {
        since = Math.floor(a.getTime() / 1000);
      } else if (typeof since === 'string') {
        since = Math.floor((new Date(since)).getTime() / 1000);
      }
      params = { since: since };
    }
    var json = await this.request('/v3/circles/' + this.id + '/members/history', { params: params });
    var locations = new life360_location_list(this.api);
    for (var i = 0; i < json.locations.length; i++) {
      locations.addChild(new life360_location(json[i].locations));
    }
    return locations;
  }
  async listMembers() {
    var json = await this.request('/v3/circles/' + this.id + '/members');
    this.members = new life360_member_list(this.api);
    this.members.circle = this;
    for (var i = 0; i < json.members.length; i++) {
      var child = this.members.addChild(new life360_member(json.members[i]));
      child.circle = this;
    }
    return this.members;
  }
  async messages(count) {
    var params;
    if (count !== undefined) params = { count: count };
    var json = await this.request('/v3/circles/' + this.id + '/messages', {
      params: params,
    });
    debugger;
    return json;
  }
  async nearbyplaces(lat, lon, wifiscan) {
    var params;
    if (wifiscan !== undefined) {
      params = { wifiscan: wifiscan };
    }
    var json = await this.request('/v3/circles/' + this.id + '/nearbyplaces/' + lat + '/' + lon);
    // todo: return life360_place_list
    debugger;
    return json;
  }
  async places() {
    var json = await this.request('/v3/circles/' + this.id + '/places');
    // todo: return life360_place_list
    debugger;
    return json;
  }
  async watchList() {
    if (global.DEBUG_FLAG === false) throw 'not implemented';
    var json = await this.request('/v3/circles/' + this.id + '/driverbehavior/watchlist');
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
    var json = await this.request('/v3/circles/' + this.id + '/code', {
      method: 'post',
    });
    debugger;
    return json;
  }
  async startSmartRealTime() {
    var json = await this.request('/v3/circles/' + this.id + '/smartRealTime/start', {
      method: 'post',
    });
    debugger;
    return json;
  }
  async sendMessage() {
    var json = await this.request('/v3/circles/' + this.id + '/threads/message', {
      method: 'post',
    });
    debugger;
    return json;
  }
}
class life360_circle_list extends life360_api_helper {
}

class life360_crime extends life360_api_helper {
  _fix() {
    if (this.incidentDate !== undefined && typeof this.incidentDate !== 'object') this.incidentDate = tryCreateDate(this.incidentDate);
    if (this.incident_date !== undefined && typeof this.incident_date !== 'object') this.incident_date = tryCreateDate(this.incident_date);

    if (this.id !== undefined && typeof this.id === 'string') this.id = tryCreateInt(this.id);
  }
}
class life360_crime_list extends life360_api_helper {
}

class life360_offender extends life360_api_helper {
  _fix() {
  }
}
class life360_offender_list extends life360_api_helper {
}

class life360_safetypoint extends life360_api_helper {
  _fix() {
    if (this.incidentDate !== undefined && typeof this.incidentDate !== 'object') this.incidentDate = tryCreateDate(this.incidentDate);
    if (this.incident_date !== undefined && typeof this.incident_date !== 'object') this.incident_date = tryCreateDate(this.incident_date);

    if (this.id !== undefined && typeof this.id === 'string') this.id = tryCreateInt(this.id);
  }
}
class life360_safetypoint_list extends life360_api_helper {
}

class life360_location extends life360_api_helper {
  _fix() {
    if (this.startTimestamp !== undefined && typeof this.startTimestamp !== 'object') this.startTimestamp = tryCreateDate(this.startTimestamp);
    if (this.endTimestamp !== undefined && typeof this.endTimestamp !== 'object') this.endTimestamp = tryCreateDate(this.endTimestamp);
    if (this.since !== undefined && typeof this.since !== 'object') this.since = tryCreateDate(this.since);
    if (this.timestamp !== undefined && typeof this.timestamp !== 'object') this.timestamp = tryCreateDate(this.timestamp);

    if (this.accuracy !== undefined && typeof this.accuracy === 'string') this.accuracy = tryCreateInt(this.accuracy);
    if (this.battery !== undefined && typeof this.battery === 'string') this.battery = tryCreateInt(this.battery);
    if (this.charge !== undefined && typeof this.charge === 'string') this.charge = tryCreateInt(this.charge);
    if (this.speed !== undefined && typeof this.speed === 'string') this.speed = tryCreateInt(this.speed);

    if (this.inTransit !== undefined && typeof this.inTransit !== 'boolean') this.inTransit = tryCreateBool(this.inTransit);
    if (this.isDriving !== undefined && typeof this.isDriving !== 'boolean') this.isDriving = tryCreateBool(this.isDriving);
    if (this.wifiState !== undefined && typeof this.wifiState !== 'boolean') this.wifiState = tryCreateBool(this.wifiState);
  }
}
class life360_location_list extends life360_api_helper {
}

class life360_member extends life360_api_helper {
  _fix() {
    if (this.createdAt !== undefined && typeof this.createdAt !== 'object') this.createdAt = tryCreateDate(this.createdAt);
    if (this.isAdmin !== undefined && typeof this.isAdmin !== 'boolean') this.isAdmin = tryCreateBool(this.isAdmin);
    if (this.location !== undefined && this.location.constructor === Object) this.location = new life360_location(this.api, this.location);

    if (this.features !== undefined && typeof this.features === 'object') {
      var booleanKeys = ['device', 'disconnected', 'geofencing', 'mapDisplay', 'nonSmartphoneLocating', 'pendingInvite', 'shareLocation', 'smartphone'];
      booleanKeys.forEach((key) => {
        if (this.features[key] !== undefined && typeof this.features[key] !== 'boolean') this.features[key] = tryCreateBool(this.features[key]);
      });
      if (this.features.shareOffTimestamp !== undefined && typeof this.features.shareOffTimestamp !== 'object') this.features.shareOffTimestamp = tryCreateDate(this.features.shareOffTimestamp);
    }
  }
  async refresh() {
    var json = await this.api.member(this.circle.id, this.id);
    this._fix(json);
    return this;
  }
  async history(time) {
    var params;
    if (time !== undefined) {
      if (time instanceof Date) {
        time = Math.floor(a.getTime() / 1000);
      } else if (typeof time === 'string') {
        time = Math.floor((new Date(time)).getTime() / 1000);
      }
      params = { time: time };
    }
    var json = await this.request('/v3/circles/' + this.circle.id + '/members/' + this.id + '/history', { params: params });
    var locations = new life360_location_list(this.api);
    for (var i = 0; i < json.locations.length; i++) {
      locations.addChild(new life360_location(json.locations[i]));
    }
    return locations;
  }
  async requestLocation() {
    var json = await this.request('/v3/circles/' + this.circle.id + '/members/' + this.id + '/request', {
      method: 'post',
      body: {
        type: 'location',
      },
    });
    var request = new life360_location_request(this.api, json);
    request.member = this;
    request.circle = this.circle;
    return request;
  }
  async requestCheckIn() {
    var json = await this.request('/v3/circles/' + this.circle.id + '/members/' + this.id + '/request', {
      method: 'post',
      body: {
        type: 'checkin',
      },
    });
    var request = new life360_checkin_request(this.api, json);
    request.member = this;
    request.circle = this.circle;
    return request;
  }
}
class life360_member_list extends life360_api_helper {
}

class life360_message extends life360_api_helper {
}

class life360_place extends life360_api_helper {
}

class life360_thread extends life360_api_helper {
}

class life360_session extends life360_api_helper {
}

class life360 {
  constructor() {
    this.defaults = {
      hostname: 'www.life360.com',
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
  async login(username, password) {
    var json = await this.request('/v3/oauth2/token', {
      authorization: 'Basic U3dlcUFOQWdFVkVoVWt1cGVjcmVrYXN0ZXFhVGVXckFTV2E1dXN3MzpXMnZBV3JlY2hhUHJlZGFoVVJhZ1VYYWZyQW5hbWVqdQ==',
      body: {
        countryCode: 1,
        password: password,
        username: username,
        phone: '',
        grant_type: 'password',
      },
    });
    var token_type = json.token_type;
    if (!token_type) token_type = 'Bearer';
    this.authorization = token_type + ' ' + json.access_token;
    this.session = new life360_session(this, json);
    return json;
  }
  logout() {
    if (this.session) {
      var access_token = this.session.access_token;
      var token_type = this.session.token_type;
      if (global.DEBUG_FLAG === false) throw 'not implemented';
      debugger;
      this.session = undefined;
      this.authorization = undefined;
    } else {
      throw new Error('Not logged in.');
    }
  }
  async listCrimes(args) {
    var params = {};
    if (args) {
      if (args.start) params.startDate = args.start;
      if (args.end) params.endDate = args.end;
      if (args.page) params.page = args.page;
      if (args.pageSize) params.pageSize = args.pageSize;
      if (args.topLeft) {
        var topLeftLatLon = findLatLonFromVariable(args.topLeft);
        params['boundingBox[topLeftLatitude]'] = topLeftLatLon.lat;
        params['boundingBox[topLeftLongitude]'] = topLeftLatLon.lon;
      }
      if (args.bottomRight) {
        var bottomRightLatLon = findLatLonFromVariable(args.bottomRight);
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
    var json = await this.request('/v3/crimes', { params: params });
    var crimes_json = json.crimes;
    var crimes = new life360_crime_list(this);
    for (var i = 0; i < crimes_json.length; i++) {
      crimes.addChild(new life360_crime(crimes_json[i]));
    }
    return crimes;
  }
  async getMe() {
    var json = this.request('/v3/users/me');
    this.me = new life360_member(this, json);
    return this.me;
  }
  async listCircles() {
    var json = await this.request('/v3/circles');
    this.circles = new life360_circle_list(this);
    for (var i = 0; i < json.circles.length; i++) {
      this.circles.addChild(new life360_circle(json.circles[i]));
    }
    return this.circles;
  }
  async listSafetyPoints() {
    var params = {};
    var args = arguments;
    if (args.length === 1) {
      var latLon = findLatLonFromVariable(args[0]);
      params['centerPoint[latitude]'] = latLon.lat;
      params['centerPoint[longitude]'] = latLon.lon;
    } else if (args.length === 2) {
      params['centerPoint[latitude]'] = args[0];
      params['centerPoint[longitude]'] = args[1];
    }
    var json = await this.request('/v3/safetyPoints', { params: params });
    var locations = new life360_safetypoint_list(this.api);
    for (var i = 0; i < json.safetyPoints.length; i++) {
      var child = locations.addChild(new life360_safetypoint(json.safetyPoints[i]));
      child.locationType = 'safetyPoint';
    }
    return locations;
  }
  async listOffenders() {
    var params = {};
    var args = arguments;
    if (args.length === 1) {
      var latLon = findLatLonFromVariable(args[0]);
      params['centerPoint[latitude]'] = latLon.lat;
      params['centerPoint[longitude]'] = latLon.lon;
    } else if (args.length === 2) {
      params['centerPoint[latitude]'] = args[0];
      params['centerPoint[longitude]'] = args[1];
    }
    var json = await this.request('/v3/safetyPoints', { params: params });
    var locations = new life360_offender_list(this.api);
    for (var i = 0; i < json.safetyPoints.length; i++) {
      var child = locations.addChild(new life360_offender(json.safetyPoints[i]));
      child.locationType = 'safetyPoint';
    }
    return locations;
  }
  request(a, b) {
    var options;
    if (b === undefined) {
      if (typeof a === 'string') {
        options = {
          path: a,
        };
      }
    } else {
      options = b;
      options.path = a;
    }
    var self = this;
    function findHeaderCaseInsensitive(name, headers) {
      var keys = Object.keys(headers);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.localeCompare(name, self.locale, { sensitivity: 'base' }) === 0) {
          return headers[key];
        }
      }
    }

    var hostname = this.defaults.hostname;
    var path = this.defaults.path;
    var encoding = this.defaults.encoding;
    var headers = {};
    var body = this.defaults.body;
    var type = this.defaults.type;
    var method = this.defaults.method;
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
      var keys = Object.keys(this.defaults.headers);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = this.defaults.headers[key];
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
      var headersKeys = Object.keys(options.headers);
      for (var i = 0; i < headersKeys.length; i++) {
        headers[headersKeys[i]] = headersKeys[headersKeys[i]];
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

    var authorization;
    if (options.auth) {
      authorization = options.auth;
    } else if (options.authorization) {
      authorization = options.authorization;
    } else if (this.authorization) {
      authorization = this.authorization;
    }
    if (authorization) {
      if (typeof authorization === 'string') {
        if (authorization.indexOf(' ') === -1) {
          authorization = 'Basic ' + authorization;
        }
        headers.Authorization = authorization;
      } else if (typeof authorization === 'object') {
        var auth_type;
        var base64_value;
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
    var request_options = {
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
        var contentTypeHeader = findHeaderCaseInsensitive('content-type', res.headers);
        if (contentTypeHeader !== undefined) {
          var parts = contentTypeHeader.split(';');
          bodyType = parts[0];
          for (var i = 1; i < parts.length; i++) {
            var part = parts[i].split('=');
            if (part[0] === 'charset') {
              if (part.length > 1) {
                bodyCharset = part[1];
              }
            }
          }
        }

        res.on('data', function (chunk) {
          if (buffer === undefined) {
            buffer = chunk;
          } else {
            buffer = Buffer.concat([buffer, chunk]);
          }
        });
        res.on('end', function () {
          try {
            // done reading body

            var body;
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
