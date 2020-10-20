# Disection of the Life360.com undocumented API

[Go back](README.md)

* [Disecting Circles](DISECTION_CIRCLES.md)
* [Disecting "Put Location"](DISECTION_PUT_LOCATION.md)

## Setup

Using Debian 10.2 with a bash terminal. Installed curl.

Base url is `https://www.life360.com/` 

All requests include the header `Accept: application/json`

Expect each response to be a `200 OK`

Any personally identifying information in the example responses will be omitted.

## Initalize variables

```bash
USER=johndoe@example.com
PASS=mySecure5Password45t
```

## Login @ `/v3/oauth2/token`

```bash
curl -H "Accept: application/json" -H "Authorization: Basic U3dlcUFOQWdFVkVoVWt1cGVjcmVrYXN0ZXFhVGVXckFTV2E1dXN3MzpXMnZBV3JlY2hhUHJlZGFoVVJhZ1VYYWZyQW5hbWVqdQ==" https://www.life360.com/v3/oauth2/token --data "username=$USER&password=$PASS&grant_type=password"
```

Response
```json
{
  "access_token": "rAnDoMChArAcTeRsInToKeN123456789AcEsSToKeNString",
  "token_type": "Bearer",
  "onboarding": 0,
  "user": {
    "id": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345",
    "firstName": "John", 
    "lastName": "Doe",
    "loginEmail": "johndoe@example.com",
    "loginPhone": "+15555550123",
    "avatar": "/img/user_images/abcdefgh-ijkl-mnop-qrst-uvwxyz012345/abcdefgh-ijkl-mnop-qrst-uvwxyz012345.png?fd=2",
    "locale": "en_US",
    "language": "en",
    "created": "2019-01-02 03:45:56",
    "settings": {
      "map": {
        "police": "1",
        "fire": "1",
        "hospital": "1",
        "sexOffenders": "1",
        "crime": "1",
        "crimeDuration": "a",
        "family": "1",
        "advisor": "1",
        "placeRadius": "1",
        "memberRadius": "1"
      },
      "alerts": { "crime": "1", "sound": "1" },
      "zendrive": { "sdk_enabled": "OFF" },
      "locale": "en_US",
      "unitOfMeasure": "i",
      "dateFormat": "mdy12",
      "timeZone": "America/New_York"
    },
    "communications":[
      { "channel": "Voice", "value": "+15555550123", "type": "Home" },
      { "channel": "Email", "value": "johndoe@example.com", "type": "" }
    ],
    "cobranding": []
  },
  "cobranding": [],
  "promotions": [],
  "state": null
}
```

**Set token acquired from logging in**

```bash
TOKEN=rAnDoMChArAcTeRsInToKeN123456789AcEsSToKeNString
```

## List Circles @ `/v3/circles`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles
```

Response
```json
{
  "circles": [
    {
      "id": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345",
      "name": "Family",
      "color": "f000f0",
      "type": "basic",
      "createdAt": "1451140007",
      "memberCount": "3",
      "unreadMessages": "0",
      "unreadNotifications": "0",
      "features": {
        "ownerId": null,
        "skuId": null,
        "premium": "0",
        "locationUpdatesLeft": 0,
        "priceMonth": "0",
        "priceYear": "0",
        "skuTier": null
      }
    }
  ]
}
```

Optionally, set the `CIRCLE_ID` variable to your circle id.

```bash
CIRCLE_ID=abcdefgh-ijkl-mnop-qrst-uvwxyz012345
```

### [Click here to view more information about circles](DISECTION_CIRCLES.md)

## Information about yourself

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/users/me
```

Response
```json
{
  "id": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345",
  "firstName": "John",
  "lastName": "Doe",
  "loginEmail": "johndoe@example.com",
  "loginPhone": "+15555550123",
  "avatar": "\/img\/user_images\/abcdefgh-ijkl-mnop-qrst-uvwxyz012345\/abcdefgh-ijkl-mnop-qrst-uvwxyz012345.png?fd=2",
  "locale": "en_US",
  "language": "en",
  "created": "2019-01-02 03:45:56",
  "settings": {
    "map": {
      "police": "1",
      "fire": "1",
      "hospital": "1",
      "sexOffenders": "1",
      "crime": "1",
      "crimeDuration": "a",
      "family": "1",
      "advisor": "1",
      "placeRadius": "1",
      "memberRadius": "1"
    },
    "alerts": { "crime": "1", "sound": "1" },
    "zendrive": { "sdk_enabled": "OFF" },
    "locale": "en_US",
    "unitOfMeasure": "i",
    "dateFormat": "mdy12",
    "timeZone": "America/New_York"
  },
  "communications": [
    { "channel": "Voice", "value": "+15555550123", "type": "Home" },
    { "channel": "Email", "value": "johndoe@example.com", "type": "" }
  ],
  "cobranding": []
}
```

## Crimes

Get crimes from November 1st to December 1st with a bounding box around downtown York PA.

See [http://bboxfinder.com/](http://bboxfinder.com/#39.95,-76.73,39.96,-76.72) for the bounding box.

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" "https://www.life360.com/v3/crimes?boundingBox[bottomRightLatitude]=39.94&boundingBox[bottomRightLongitude]=-76.72&boundingBox[topLeftLatitude]=39.95&boundingBox[topLeftLongitude]=-76.73"
```

Response *(only 2 crimes shown here for sake of brevity)*
```json
{
  "crimes": [
    {
      "id": "134776059",
      "incident_date": null,
      "type": "Theft",
      "address": "8XX S NEWBERRY ST, YORK, PA",
      "latitude": "39.949431733867",
      "longitude": "-76.729124090221",
      "source": "http://spotcrime.com/mobile/crime/?134776059-4f63aa20be59b112e52345d337225940",
      "description": "A Theft Report",
      "incidentDate": "1575265800"
    },
    {
      "id": "121711154",
      "incident_date": null,
      "type": "Vandalism",
      "address": "10XX S GEORGE ST, YORK, PA",
      "latitude": "39.946233",
      "longitude": "-76.720702",
      "source": "http://spotcrime.com/mobile/crime/?121711154-3f84341191380addcb98c0eb9245ca6c",
      "description": "Criminal Mischief.",
      "incidentDate": "1551192600"
    },
    ...
  ]
}
```
