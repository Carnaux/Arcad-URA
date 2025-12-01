# Arcad URA

# Tech

- [React.JS](https://react.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React-Three-Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [MQTT](https://mqtt.org/)

# How to install and run

### To install

1. With the repo cloned, open a terminal in the root folder `/ARCAD-R3F/` and run: `npm install`

### To run

Check the backend folder README, it will show how to run the local broker.

1. In the terminal and run: `yarn start`

## TODO

Pre process mqtt message to split sensors/actuators rather the the full payload:

instead of:

```
pushToPayloadHistory(payload);
```

do:

```
const motorLeftPayload = processPayload('motorLeft');
...
const motorDirPayload = processPayload('motorDir');

pushToMotorDirHistory(motorDirPayload);
```
