# life360-node-api

An unofficial implementation of Life360's API in Node.js.

I dissected the HTTP api behind Life360.com. This library allows you to login, see information about your family and circles, and locate your family members.

## Install

```console
$ npm install life360-node-api
```

## Usage

```js
const life360 = require('life360-node-api')
```

Every function that talks to Life360.com will be asynchronous.

Login with your username and password.

```js
await life360.login('myusername', 'mySecurePassword123')
```

Get a list of your circles and log the names of each of them

```js
let circles = await life360.circles()

for (var circle of circles) {
  console.log(circle.name)
}
```

Get a list of your circle's members

```js
let myCircle = circles[0]
let members = await myCircle.members()

for (var member of members) {
  console.log(`${member.firstName} ${member.lastName}`)
}
```
