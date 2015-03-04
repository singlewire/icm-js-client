# InformaCast Mobile REST Client

A simple REST client for Node to communicate with the InformaCast Mobile API. This library defines a simple wrapper
around the great [https://github.com/cujojs/rest](rest) library. Because of this, the format of request params and
client configuration params are the same.

## Usage

Make sure to require the client in your code

```javascript
var ICMClient = require('icm-nodejs-client');
```

Create an instance of the client

```javascript
var client = ICMClient({
    token: 'KBXCNEAYXEI6JOUVXDUFMMTXI3PHWUNALIPBDZFLGGFB2AZ5YM5HDYNJFLIVWX6ZT56A='
});
```

A list of options that can be passed to create the client can be found in the table below:

| Name            | Required | Type     | Default                     | Description                                                                                                                                                                   |
|-----------------|----------|----------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url             | false    | String   |'https://api.singlewire.com' | Used if necessary to provide a different API endpoint. Useful for testing.                                                                                                    |
| token           | true     | String   | null                        | The required API token to authorize requests.                                                                                                                                 |
| clientSetup     | false    | Function | null                        | Passes the wrapped `rest` object for additional configuration. Useful for defining additional [https://github.com/cujojs/rest/blob/master/docs/interceptors.md](interceptors) |

### Create

```javascript
client.users().create({entity: {name: 'John Smith', email: 'john.smith@acme.com'}});
client.notifications().create({entity: {messageTemplateId: 'cc93bfd0-9917-11e4-a401-c22f013130a9', subject: 'FooBar'}});
```

### Read

To read an individual resource:

```javascript
client.users('fa875180-7fc3-11e4-a09c-7a198bebdf90').show();
client.users('fa875180-7fc3-11e4-a09c-7a198bebdf90').notifications('3bc560d0-974b-11e4-b83f-1ae59cb5b126').show();
```

To list/paginate/search a resource:

```javascript
// List with the default page size
client.users().list();

// List with max of 50 per page
client.users().list({params: {limit: 50}});

// Search for users with the name John
client.users().list({params: {q: 'John'}});

// The client library a helper method to make pagination easier
client.paginate(client.users().list(), function(usersPage) {
    // Do something awesome with this page
    return true; // Return true to get the next page (if available), false to stop
}, function(error) {
    // Something went wrong!
});
```

### Update

```javascript
client.users('de7b51a0-5a1e-11e4-ab31-8a1d033dd637').update({entity: {name: 'John Jacob Smith'}});
client.distributionLists('dada08f0-7fc3-11e4-a09c-7a198bebdf90').update({entity: {name: 'Updated Name'}});
```

### Delete

```javascript
client.users('de7b51a0-5a1e-11e4-ab31-8a1d033dd637').remove();
client.distributionLists('dada08f0-7fc3-11e4-a09c-7a198bebdf90').remove();
```

### Note

Every request returns a `Promise` object and can be used as described below. The response format can be found in the
[https://github.com/cujojs/rest/blob/master/docs/interfaces.md#common-response-properties](Common Response Properties)
section of the [https://github.com/cujojs/rest](rest) docs.

```javascript
var responsePromise = ...;
responsePromise.then(function(response) {
    // Request was successful, process the data
}, function (error) {
    // Request failed
});
```

## Building

Make sure gulp is installed:

```npm install -g gulp```

Make sure you've ran:

```npm install```

To build, simply run:

```gulp```

## Testing

```npm test```

## License

TODO

