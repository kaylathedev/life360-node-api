# Disection of the Life360.com undocumented API - Put Location

[Go back](DISECTION.md)

Android devices running Life360 update the location using the following request.

```text
PUT /v4/locations HTTP/1.1
X-UserContext: eyJnZW9sb2NhdGlvbiI6eyJsYXQiOiIwLjAiLCJsb24iOiIwLjAiLCJhbHQiOiIwLjAiLCJhY2N1cmFjeSI6IjEwLjAwIiwiaGVhZGluZyI6IjAuMCIsInNwZWVkIjoiMC4wIiwidGltZXN0YW1wIjoiMTYwMzE1MTQwMCIsImFnZSI6IjEifSwiZ2VvbG9jYXRpb25fbWV0YSI6eyJ3c3NpZCI6IjAxOjIzOjQ1OjY3Ojg5OmFiIiwicmVxc3NpZCI6IlwiV2lmaSBTU0lEXCIiLCJsbW9kZSI6ImZvcmUifSwiZGV2aWNlIjp7ImJhdHRlcnkiOiI5OSIsImNoYXJnZSI6IjEiLCJ3aWZpX3N0YXRlIjoiMSIsImJ1aWxkIjoiMjI4OTgwIiwiZHJpdmVTREtTdGF0dXMiOiJPRkYiLCJ1c2VyQWN0aXZpdHkiOiJ1bmtub3duIn19
Accept: application/json
Accept-Language: en_US
User-Agent: com.life360.android.safetymapd/KOKO/20.6.0 android/9
X-Device-ID: 0123456789abcdef
Authorization: Bearer 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB
Content-Type: application/x-www-form-urlencoded
Content-Length: 0
Host: android.life360.com
Connection: Keep-Alive
Accept-Encoding: gzip
```

A successful response is a 200 with no body. I have removed headers, modified and resent the above request many times. I found that all you need to update your location is this.

```text
PUT /v4/locations HTTP/1.1
X-UserContext: eyJnZW9sb2NhdGlvbiI6eyJsYXQiOiIwLjAiLCJsb24iOiIwLjAiLCJhbHQiOiIwLjAiLCJhY2N1cmFjeSI6IjEwLjAwIiwiaGVhZGluZyI6IjAuMCIsInNwZWVkIjoiMC4wIiwidGltZXN0YW1wIjoiMTYwMzE1MTQwMCIsImFnZSI6IjEifSwiZ2VvbG9jYXRpb25fbWV0YSI6eyJ3c3NpZCI6IjAxOjIzOjQ1OjY3Ojg5OmFiIiwicmVxc3NpZCI6IlwiV2lmaSBTU0lEXCIiLCJsbW9kZSI6ImZvcmUifSwiZGV2aWNlIjp7ImJhdHRlcnkiOiI5OSIsImNoYXJnZSI6IjEiLCJ3aWZpX3N0YXRlIjoiMSIsImJ1aWxkIjoiMjI4OTgwIiwiZHJpdmVTREtTdGF0dXMiOiJPRkYiLCJ1c2VyQWN0aXZpdHkiOiJ1bmtub3duIn19
X-Device-ID: 0123456789abcdef
Authorization: Bearer 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB
Host: android.life360.com
```

If you are using a library to make HTTP requests, you only need to specifiy the following information.

**Host:** android.life360.com

**Path:** /v4/locations

**HTTP Method:** PUT

**Headers**

* `X-UserContext`
* `X-Device-ID`
* `Authorization`

## Analysis

`Authorization` contains the authentication token which is given upon logging in.

---

`X-UserContext` is a base64 encoded, serialized JSON object which resembles something like this.

```json
{
  "geolocation": {
    "lat": "0.0",
    "lon": "0.0",
    "alt": "0.0",
    "accuracy": "10.00",
    "heading": "0.0",
    "speed": "0.0",
    "timestamp": "1603151400",
    "age": "1"
  },
  "geolocation_meta": {
    "wssid": "01:23:45:67:89:ab",
    "reqssid": "\"Wifi SSID\"",
    "lmode": "fore"
  },
  "device": {
    "battery": "99",
    "charge": "1",
    "wifi_state": "1",
    "build": "228980",
    "driveSDKStatus": "OFF",
    "userActivity":"unknown"
  }
}
```

---

`X-Device-ID` appears to be a 64 bit hexadecimal string. It is required upon making the PUT request, and Life360 will not update your location if you provide the wrong device id. I attempted to determine how this is created/retrieved. By using HttpCanary (an Android packet capturer), it looks like the app either generates this id, or it retrieves it from the Android system itself.

I have not determined the original source of this id.
