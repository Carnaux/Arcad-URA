To run the local mqtt broker:

1. Install mosquitto from here https://mosquitto.org/download/
2. Go on your local installation of `mosquitto.config`. This path will vary from OS to OS.
3. If that file does not exist create it and add this code:

```
allow_anonymous true
listener 1883
protocol mqtt

listener 9001
protocol websockets
```

4. Open a fresh terminal and run `mosquitto -c /opt/homebrew/etc/mosquitto/mosquitto.conf -v` change the path to match your OS.

To debug it, open a new terminal and run `mosquitto_sub -h localhost -p 1883 -t '#' -v`. This will listen to anything you send in your local broker.
