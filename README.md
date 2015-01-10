# InformaCast Mobile REST Client

A simple REST client for Node to communicate with the InformaCast Mobile API. This library defines a simple wrapper
around the great [https://www.npmjs.com/package/request](request) library. Because of this, the format of request params
and client configuration params are the same.

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

| Name            | Required | Default                      | Description                                             |
|-----------------|----------|------------------------------|---------------------------------------------------------|
| url             | false    | 'https://api.singlewire.com' | Used if necessary to provide a different API endpoint.  |
| token           | true     | null                         | The required API token to authorize requests.           |
| requestDefaults | false    | {}                           | The defaults that can be passed to the request library  |

### Create

```javascript
client.users().create({form: {name: 'John Smith', email: 'john.smith@acme.com'}});
client.notifications().create({form: {messageTemplateId: 'cc93bfd0-9917-11e4-a401-c22f013130a9', subject: 'FooBar'}});
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
client.users().list({form: {limit: 50}});

// Search for users with the name John
client.users().list({form: {q: 'John'}});

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
client.users('de7b51a0-5a1e-11e4-ab31-8a1d033dd637').update({form: {name: 'John Jacob Smith'}});
client.distributionLists('dada08f0-7fc3-11e4-a09c-7a198bebdf90').update({form: {name: 'Updated Name'}});
```

### Delete

```javascript
client.users('de7b51a0-5a1e-11e4-ab31-8a1d033dd637').remove();
client.distributionLists('dada08f0-7fc3-11e4-a09c-7a198bebdf90').remove();
```

### Note

Every request returns a `Promise` object and can be used like so:

```javascript
var responsePromise = ...;
responsePromise.then(function(response) {
    // Response is typically the deserialized JSON
}, function (error) {
    var requestError = error[0]; // The error
    var httpRequest = error[1]; // The request that was made
    var response = error[2]; // The error response
});
```

## License

TODO

