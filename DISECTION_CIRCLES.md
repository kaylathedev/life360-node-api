# Disection of the Life360.com undocument API - Circles

[Go back](DISECTION.md)

Make sure your CIRCLE variable is set to the circle id you want to inspect.

```bash
CIRCLE_ID=abcdefgh-ijkl-mnop-qrst-uvwxyz012345
```


## Get circle info @ `/v3/circles/$CIRCLE_ID`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID
```

Response
```json
{
}
```


## ???code??? @ `/v3/circles/$CIRCLE_ID/code`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/code
```

Response
```json
{
}
```


## List members @ `/v3/circles/$CIRCLE_ID/members`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/members
```

Response
```json
{
}
```


## Get emergency contacts @ `/v3/circles/$CIRCLE_ID/emergencyContacts`

### Needs more disection!!!

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/emergencyContacts
```

Response
```json
{
  "emergencyContacts": []
}
```


## List messages @ `/v3/circles/$CIRCLE_ID/messages`

Optional GET argument: `count=INTEGER`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/messages
```

Response
```json
{
  "messages": [
    {
      "id": "01234567-8912-3456-7890-abcdefgh1111",
      "userId": "01234567-8912-3456-7890-abcdefgh1111",
      "toUserId": [
        "01234567-8912-3456-7890-abcdefgh1111"
      ],
      "text": "Test. Ignore this.",
      "title": "Me to Dad",
      "type": "message",
      "channel": "fc",
      "timestamp": 1570900000,
      "location": null,
      "clientMessageId": null,
      "interfaces": [],
      "photo": null
    },
    {
      "id": "01234567-8912-3456-7890-abcdefgh1111",
      "userId": "01234567-8912-3456-7890-abcdefgh1111",
      "toUserId": [
        "01234567-8912-3456-7890-abcdefgh1111"
      ],
      "text": "❤ that you are at Home.",
      "title": "Dad to Me",
      "type": "message",
      "channel": "fc",
      "timestamp": 1528240000,
      "location": null,
      "clientMessageId": null,
      "interfaces": [],
      "photo": null
    },
    {
      "id": "01234567-8912-3456-7890-abcdefgh1111",
      "userId": "01234567-8912-3456-7890-abcdefgh1111",
      "toUserId": [
        "01234567-8912-3456-7890-abcdefgh1111",
        "01234567-8912-3456-7890-abcdefgh1111"
      ],
      "text": "Checked in @ Home",
      "title": "Dad to Me, Mom",
      "type": "message",
      "channel": "fc",
      "timestamp": 1528240000,
      "location": {
        "latitude": "39.8",
        "longitude": "-76.7",
        "accuracy": "0",
        "startTimestamp": null,
        "endTimestamp": 1528240000,
        "since": null,
        "timestamp": 1528240000,
        "name": null,
        "placeType": null,
        "source": null,
        "sourceId": null,
        "address1": "9 Dummy st",
        "address2": "York, PA",
        "shortAddress": null,
        "inTransit": "0",
        "tripId": null,
        "driveSDKStatus": null,
        "battery": null,
        "charge": "0",
        "wifiState": null,
        "speed": 0,
        "isDriving": "0",
        "userActivity": null
      },
      "clientMessageId": null,
      "interfaces": [],
      "photo": null
    },
    {
      "id": "01234567-8912-3456-7890-abcdefgh1111",
      "userId": "01234567-8912-3456-7890-abcdefgh1111",
      "toUserId": [
        "01234567-8912-3456-7890-abcdefgh1111"
      ],
      "text": "Yippee",
      "title": "Chris to Me",
      "type": "message",
      "channel": "fc",
      "timestamp": 1451140000,
      "location": {
        "latitude": "38.3",
        "longitude": "-75.1",
        "accuracy": "8.3",
        "startTimestamp": null,
        "endTimestamp": 1451140000,
        "since": null,
        "timestamp": 1451140000,
        "name": null,
        "placeType": null,
        "source": null,
        "sourceId": null,
        "address1": "Something Rd",
        "address2": "Baltimore, MD",
        "shortAddress": null,
        "inTransit": "0",
        "tripId": null,
        "driveSDKStatus": null,
        "battery": null,
        "charge": "0",
        "wifiState": null,
        "speed": 0,
        "isDriving": "0",
        "userActivity": null
      },
      "clientMessageId": null,
      "interfaces": [],
      "photo": null
    }
  ],
  "names": {
    "01234567-8912-3456-7890-abcdefgh1111": {
      "name": "Dads Name",
      "status": "A"
    },
    "01234567-8912-3456-7890-abcdefgh2222": {
      "name": "Moms Name",
      "status": "A"
    },
    "01234567-8912-3456-7890-abcdefgh3333": {
      "name": "Kids Name",
      "status": "A"
    }
  }
}
```


## Get member alerts @ `/v3/circles/$CIRCLE_ID/member/alerts`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/member/alerts
```

Response
```json
{
  "alerts": [
    {
      "memberId": "01234567-8912-3456-7890-abcdefgh1111",
      "lowBattery": true
    },
    {
      "memberId": "01234567-8912-3456-7890-abcdefgh2222",
      "lowBattery": true
    }
  ]
}

```


## Get members history @ `/v3/circles/$CIRCLE_ID/members/history`

Optional GET argument: `since=UNIX_TIMESTAMP_SECONDS`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/members/history
```

Response
```json
{
  "locations": [
    {
      "latitude":   "39.9",
      "longitude": "-76.6",
      "accuracy": "50",
      "startTimestamp": "1576000000",
      "endTimestamp":   "1577000000",
      "since":     "1576123000",
      "timestamp": "1576128000",
      "name": "High Paying Job",
      "placeType": null,
      "source": false,
      "sourceId": null,
      "address1": "High Paying Job",
      "address2": "",
      "shortAddress": "",
      "inTransit": "0",
      "tripId": null,
      "driveSDKStatus": null,
      "battery": "91",
      "charge": "0",
      "wifiState": "0",
      "speed": 0,
      "isDriving": "0",
      "userActivity": "unknown",
      "userId": "01234567-8912-3456-7890-abcdefghijkl"
    },
    {
      "latitude":   "39.8",
      "longitude": "-76.7",
      "accuracy": "50",
      "startTimestamp": "1576000000",
      "endTimestamp":   "1577000000",
      "since":     "1576123000",
      "timestamp": "1576128000",
      "name": "Home",
      "placeType": null,
      "source": false,
      "sourceId": null,
      "address1": "Home",
      "address2": "",
      "shortAddress": "",
      "inTransit": "0",
      "tripId": null,
      "driveSDKStatus": null,
      "battery": "57",
      "charge": "0",
      "wifiState": "0",
      "speed": 0.0041862773,
      "isDriving": "0",
      "userActivity": "unknown",
      "userId": "01234567-8912-3456-7890-abcdefghijkl"
    }
  ]
}
```


## Get preferences @ `/v3/circles/$CIRCLE_ID/member/preferences`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/member/preferences
```

Response
```json
{
  "email": "0",
  "sms": "0",
  "push": "1",
  "shareLocation": "1"
}
```


## List all places @ `/v3/circles/$CIRCLE_ID/allplaces`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/allplaces
```

Response
```json
{
  "places": [
    {
      "id":        "01234567-8912-3456-7890-abcdefghijkl",
      "source": "l",
      "source_id": "01234567-8912-3456-7890-abcdefghijkl",
      "owner_id":  "01234567-8912-3456-7890-abcdefghijkl",
      "name": "Semper Fitness",
      "latitude":   39.9,
      "longitude": -76.7,
      "radius": 70.5,
      "address": null,
      "circle_id": "01234567-8912-3456-7890-abcdefghijkl",
      "hasAlerts": 0
    },
    {
      "id":        "01234567-8912-3456-7890-abcdefghijkl",
      "source": "l",
      "source_id": "01234567-8912-3456-7890-abcdefghijkl",
      "owner_id":  "01234567-8912-3456-7890-abcdefghijkl",
      "name": "Home",
      "latitude":   39.8,
      "longitude": -76.7,
      "radius": 150.5,
      "address": null,
      "circle_id": "01234567-8912-3456-7890-abcdefghijkl",
      "hasAlerts": 0
    },
    {
      "id":        "01234567-8912-3456-7890-abcdefghijkl",
      "source": "l",
      "source_id": "01234567-8912-3456-7890-abcdefghijkl",
      "owner_id":  "01234567-8912-3456-7890-abcdefghijkl",
      "name": "York City Work",
      "latitude":   39.8,
      "longitude": -76.8,
      "radius": 150.5,
      "address": null,
      "circle_id": "01234567-8912-3456-7890-abcdefghijkl",
      "hasAlerts": 0
    },
    {
      "id":        "01234567-8912-3456-7890-abcdefghijkl",
      "source": "l",
      "source_id": "01234567-8912-3456-7890-abcdefghijkl",
      "owner_id":  "01234567-8912-3456-7890-abcdefghijkl",
      "name": "Minimum Wage Job",
      "latitude":   39.9,
      "longitude": -76.6,
      "radius": 0,
      "address": null,
      "circle_id": "01234567-8912-3456-7890-abcdefghijkl",
      "hasAlerts": 0
    },
    {
      "id":        "01234567-8912-3456-7890-abcdefghijkl",
      "source": "l",
      "source_id": "01234567-8912-3456-7890-abcdefghijkl",
      "owner_id":  "01234567-8912-3456-7890-abcdefghijkl",
      "name": "High Paying Job",
      "latitude":   39.9,
      "longitude": -76.6,
      "radius": 300.5,
      "address": null,
      "circle_id": "01234567-8912-3456-7890-abcdefghijkl",
      "hasAlerts": 0
    }
  ]
}
```


## List places @ `/v3/circles/$CIRCLE_ID/places`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/places
```

Response
```json
{
  "places": [
    {
      "id":       "01234567-8912-3456-7890-abcdefghijkl",
      "ownerId":  "01234567-8912-3456-7890-abcdefghijkl",
      "circleId": "01234567-8912-3456-7890-abcdefghijkl",
      "name": "Home",
      "latitude":   "39.1234",
      "longitude": "-76.1234",
      "radius": "150.5",
      "type": 1,
      "typeLabel": "Other"
    },
    {
      "id":       "01234567-8912-3456-7890-abcdefghijkl",
      "ownerId":  "01234567-8912-3456-7890-abcdefghijkl",
      "circleId": "01234567-8912-3456-7890-abcdefghijkl",
      "name": "High Paying Job",
      "latitude":   "39.1234",
      "longitude": "-76.1234",
      "radius": "150.5",
      "type": null,
      "typeLabel": null
    },
    {
      "id":       "01234567-8912-3456-7890-abcdefghijkl",
      "ownerId":  "01234567-8912-3456-7890-abcdefghijkl",
      "circleId": "01234567-8912-3456-7890-abcdefghijkl",
      "name": "Minimum Wage Job",
      "latitude":   "39.1234",
      "longitude": "-76.1234",
      "radius": "0.0",
      "type": null,
      "typeLabel": null
    },
    {
      "id":       "01234567-8912-3456-7890-abcdefghijkl",
      "ownerId":  "01234567-8912-3456-7890-abcdefghijkl",
      "circleId": "01234567-8912-3456-7890-abcdefghijkl",
      "name": "York City Work",
      "latitude":   "39.1234",
      "longitude": "-76.1234",
      "radius": "300.5",
      "type": 3,
      "typeLabel": "Work"
    }
  ]
}
```


## List nearby places @ `/v3/circles/$CIRCLE_ID/nearbyplaces/$LAT/$LON`

Make sure `LAT` and `LON` variables are set before running the curl command.

Optional GET argument: `wifiscan=STRING`

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/nearbyplaces/$LAT/$LON
```

Response: Same as listing all places, but near a latitude and longitude.


## Get watch list @ `/v3/circles/$CIRCLE_ID/driverbehavior/watchlist`

### Needs more disection!!!

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" https://www.life360.com/v3/circles/$CIRCLE_ID/driverbehavior/watchlist
```

Response
```json
{
  "watchlist": [],
  "sdkEnabled": {
    "12345678-abcd-efgh-ijkl-mnopqrstuvwx": "OFF",
    "87654321-dcba-hgfe-lkji-xwvutsrqponm": "OFF"
  }
}
```

