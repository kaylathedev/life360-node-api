# life360-node-api

An unofficial implementation of Life360's API in Node.js.

I am in the progress of dissecting the HTTP api behind Life360.com. This library allows you to login, see information about your family and circles, and locate your family members.

## Disecting the API

If you are interested in how I'm understanding Life360.com's HTTP api, go to this page at [DISECTION.md](DISECTION.md).

## Install

```console
$ npm install life360-node-api
```

## Usage

```js
const life360 = require('life360-node-api')
```

Every function that talks to Life360.com will be asynchronous.

Login with your username and password. Save the new client to a variable (this holds your authentication tokens).

```js
client = await life360.login('myusername', 'mySecurePassword123')
```

Get a list of your circles and log the names of each of them

```js
let circles = await client.listCircles()

for (var circle of circles) {
  console.log(circle.name)
}
```

Get a list of your circle's members

```js
let myCircle = circles[0]
// alternatively, use the circles.findByName to search for your circle by name.
// let myCircle = circles.findByName('family')
let members = await myCircle.listMembers()

for (var member of members) {
  console.log(`${member.firstName} ${member.lastName}`)
}
```
