(function () {
    var isBrowser, ICMClient, expect, nock;

    if (typeof process !== 'undefined' && typeof module !== 'undefined' && module.exports) {
        isBrowser = false;
        ICMClient = require('../src/app');
        expect = require('chai').expect;
        nock = require('nock');
    } else {
        isBrowser = true;
        ICMClient = window.ICMClient;
        expect = chai.expect;
    }

    var baseUrl = 'https://api.icmobile.singlewire.com/api/v1-DEV';
    var user = {
        createdAt: '2015-01-12T16:52:47.614+0000',
        email: 'a@aol.com',
        id: '6fd989e0-9a7b-11e4-a6d1-c22f013130a9',
        locations: [],
        lock: null,
        name: 'a',
        permissions: ['delete', 'put', 'get'],
        securityGroups: [],
        subscriptions: []
    };
    var notFoundResponse = {status: 404, message: "Not Found"};
    var unauthorizedResponse = {type: "unauthorized", status: 401, message: "Unauthorized"};

    describe('InformaCast Mobile REST Client', function () {
        before(function () {
            if (!isBrowser) {
                nock.disableNetConnect();
            }
        });

        describe('#new()', function () {
            it('Should throw an exception when config is missing', function () {
                expect(function () {
                    ICMClient();
                }).to.throw('Config object must be present');
            });

            it('Should throw an exception when token is missing', function () {
                expect(function () {
                    ICMClient({});
                }).to.throw('Token must be present in config');
            });
        });

        describe('#resourcePath()', function () {
            it('Should have the correct methods for users resource', function () {
                var client = ICMClient({token: 'my-access-token'});
                expect(client.users()).to.have.all.keys(['list', 'create']);
                expect(client.users('user-id')).to.have.all.keys(['devices', 'notifications', 'remove', 'securityGroups',
                    'show', 'subscriptions', 'tokens', 'update', 'userPermissions']);
                expect(client.users('user-id').devices()).to.have.all.keys(['list', 'create']);
                expect(client.users('user-id').devices('device-id')).to.have.all.keys(['remove', 'show', 'update']);
                expect(client.users('user-id').notifications()).to.have.all.keys(['list']);
                expect(client.users('user-id').notifications('notification-id')).to.have.all.keys(['remove', 'show',
                    'audio', 'image', 'activities']);
                expect(client.users('user-id').notifications('notification-id').audio()).to.have.all.keys(['get']);
                expect(client.users('user-id').notifications('notification-id').image()).to.have.all.keys(['get']);
                expect(client.users('user-id').notifications('notification-id').activities()).to.have.all.keys(['create', 'list']);
                expect(client.users('user-id').notifications('notification-id').activities('activity-id')).to.have.all.keys(['show']);
                expect(client.users('user-id').securityGroups()).to.have.all.keys(['list', 'create']);
                expect(client.users('user-id').securityGroups('security-group-id')).to.have.all.keys(['remove', 'show', 'update']);
                expect(client.users('user-id').subscriptions()).to.have.all.keys(['list', 'create']);
                expect(client.users('user-id').subscriptions('subscription-id')).to.have.all.keys(['remove', 'show', 'update']);
                expect(client.users('user-id').tokens()).to.have.all.keys(['list', 'create']);
                expect(client.users('user-id').tokens('token-id')).to.have.all.keys(['remove', 'show']);
                expect(client.users('user-id').userPermissions()).to.have.all.keys(['list', 'create']);
                expect(client.users('user-id').userPermissions('permission-id')).to.have.all.keys(['remove', 'show', 'update']);
            });
        });

        describe('#show()', function () {
            var server, client;

            beforeEach(function () {
                if (isBrowser) {
                    server = sinon.fakeServer.create();
                    server.autoRespond = true;
                } else {
                    server = nock('https://api.icmobile.singlewire.com/api/v1-DEV');
                }
                client = ICMClient({token: 'my-access-token'});
            });

            afterEach(function () {
                if (isBrowser) {
                    server.restore();
                } else {
                    nock.cleanAll();
                }
            });

            it('Should fail when we receive a 404 not found', function (done) {
                if (isBrowser) {
                    server.respondWith('get', baseUrl + '/users/user-id',
                        [404, {'Content-Type': 'application/json'}, JSON.stringify(notFoundResponse)]);
                } else {
                    server.get('/users/user-id').reply(404, notFoundResponse);
                }
                client.users('user-id').show({engine: server.xhr}).then(null, function (error) {
                    expect(error.status.code).to.equal(404);
                    expect(error.entity).to.deep.equal(notFoundResponse);
                    done();
                });
            });

            it('Should fail when we receive a 401 unauthorized', function (done) {
                if (isBrowser) {
                    server.respondWith('get', baseUrl + '/users/user-id',
                        [401, {'Content-Type': 'application/json'}, JSON.stringify(unauthorizedResponse)]);
                } else {
                    server.get('/users/user-id').reply(401, unauthorizedResponse);
                }
                client.users('user-id').show({engine: server.xhr}).then(null, function (error) {
                    expect(error.status.code).to.equal(401);
                    expect(error.entity).to.deep.equal(unauthorizedResponse);
                    done();
                });
            });

            it('Can get a single user successfully', function (done) {
                if (isBrowser) {
                    server.respondWith('get', baseUrl + '/users/user-id',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(user)]);
                } else {
                    server.get('/users/user-id').reply(200, user);
                }
                client.users('user-id').show({engine: server.xhr}).then(function (response) {
                    expect(response.status.code).to.equal(200);
                    expect(response.entity).to.deep.equal(user);
                    done();
                });
            });
        });

        describe('#list()', function () {
            var server, client;

            beforeEach(function () {
                if (isBrowser) {
                    server = sinon.fakeServer.create();
                    server.autoRespond = true;
                } else {
                    server = nock('https://api.icmobile.singlewire.com/api/v1-DEV');
                }
                client = ICMClient({token: 'my-access-token'});
            });

            afterEach(function () {
                if (isBrowser) {
                    server.restore();
                } else {
                    nock.cleanAll();
                }
            });

            it('Should fail when we receive a 401 unauthorized', function (done) {
                if (isBrowser) {
                    server.respondWith('get', baseUrl + '/users',
                        [401, {'Content-Type': 'application/json'}, JSON.stringify(unauthorizedResponse)]);
                } else {
                    server.get('/users').reply(401, unauthorizedResponse);
                }
                client.paginate(client.users().list(), null, function (error) {
                    expect(error.status.code).to.equal(401);
                    expect(error.entity).to.deep.equal(unauthorizedResponse);
                    done();
                });
            });

            it('Can get an empty page of data', function (done) {
                var emptyPage = {total: 0, next: null, previous: null, data: []};
                if (isBrowser) {
                    server.respondWith('get', baseUrl + '/users',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(emptyPage)]);
                } else {
                    server.get('/users').reply(200, emptyPage);
                }
                client.paginate(client.users().list(), function (page) {
                    expect(page.status.code).to.equal(200);
                    expect(page.entity).to.deep.equal(emptyPage);
                    done();
                });
            });

            it('Can get a full page of data', function (done) {
                var fullPage = {total: 1, next: null, previous: null, data: [user]};
                if (isBrowser) {
                    server.respondWith('get', baseUrl + '/users',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(fullPage)]);
                } else {
                    server.get('/users').reply(200, fullPage);
                }
                client.paginate(client.users().list(), function (page) {
                    expect(page.status.code).to.equal(200);
                    expect(page.entity).to.deep.equal(fullPage);
                    done();
                });
            });

            it('Can get multiple pages of data', function (done) {
                var firstPage = {total: 1, next: 'first', previous: null, data: [user]};
                var secondPage = {total: 1, next: 'second', previous: 'first', data: [user]};
                var thirdPage = {total: 1, next: null, previous: 'second', data: [user]};
                var receivedPages = 0;
                if (isBrowser) {
                    server.respondWith('get', baseUrl + '/users?limit=1',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(firstPage)]);
                    server.respondWith('get', baseUrl + '/users?limit=1&start=first',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(secondPage)]);
                    server.respondWith('get', baseUrl + '/users?limit=1&start=second',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(thirdPage)]);
                } else {
                    server.get('/users?limit=1').reply(200, firstPage);
                    server.get('/users?limit=1&start=first').reply(200, secondPage);
                    server.get('/users?limit=1&start=second').reply(200, thirdPage);
                }
                client.paginate(client.users().list({params: {limit: 1}}), function (page) {
                    expect(page.status.code).to.equal(200);
                    if (!page.request.params.start) {
                        expect(page.entity).to.deep.equal(firstPage);
                    } else if (page.request.params.start === 'first') {
                        expect(page.entity).to.deep.equal(secondPage);
                    } else if (page.request.params.start === 'second') {
                        expect(page.entity).to.deep.equal(thirdPage);
                    }
                    if (++receivedPages >= 3) {
                        done();
                    }
                    return true;
                });
            });
        });

        describe('#create()', function () {
            var server, client;

            beforeEach(function () {
                if (isBrowser) {
                    server = sinon.fakeServer.create();
                    server.autoRespond = true;
                } else {
                    server = nock('https://api.icmobile.singlewire.com/api/v1-DEV');
                }
                client = ICMClient({token: 'my-access-token'});
            });

            afterEach(function () {
                if (isBrowser) {
                    server.restore();
                } else {
                    nock.cleanAll();
                }
            });

            it('Should fail when we receive a 401 unauthorized', function (done) {
                if (isBrowser) {
                    server.respondWith('post', baseUrl + '/users',
                        [401, {'Content-Type': 'application/json'}, JSON.stringify(unauthorizedResponse)]);
                } else {
                    server.post('/users', {
                        name: 'Craig Smith',
                        email: 'craig.smith@acme.com'
                    }).reply(401, unauthorizedResponse);
                }
                client.users().create({
                    entity: {name: 'Craig Smith', email: 'craig.smith@acme.com'},
                    engine: server.xhr
                }).then(null, function (error) {
                    if (isBrowser) {
                        expect(server.requests[0].requestBody).to.equal(JSON.stringify({
                            name: 'Craig Smith',
                            email: 'craig.smith@acme.com'
                        }));
                    }
                    expect(error.status.code).to.equal(401);
                    expect(error.entity).to.deep.equal(unauthorizedResponse);
                    done();
                });
            });

            it('Can create a new user', function (done) {
                if (isBrowser) {
                    server.respondWith('post', baseUrl + '/users',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(user)]);
                } else {
                    server.post('/users', {name: 'a', email: 'a@aol.com'}).reply(200, user);
                }
                client.users().create({
                    entity: {name: 'a', email: 'a@aol.com'},
                    engine: server.xhr
                }).then(function (error) {
                    if (isBrowser) {
                        expect(server.requests[0].requestBody).to.equal(JSON.stringify({
                            name: 'a',
                            email: 'a@aol.com'
                        }));
                    }
                    expect(error.status.code).to.equal(200);
                    expect(error.entity).to.deep.equal(user);
                    done();
                });
            });
        });

        describe('#update()', function () {
            var server, client;

            beforeEach(function () {
                if (isBrowser) {
                    server = sinon.fakeServer.create();
                    server.autoRespond = true;
                } else {
                    server = nock('https://api.icmobile.singlewire.com/api/v1-DEV');
                }
                client = ICMClient({token: 'my-access-token'});
            });

            afterEach(function () {
                if (isBrowser) {
                    server.restore();
                } else {
                    nock.cleanAll();
                }
            });

            it('Should fail when we receive a 404 not found', function (done) {
                if (isBrowser) {
                    server.respondWith('put', baseUrl + '/users/user-id',
                        [401, {'Content-Type': 'application/json'}, JSON.stringify(notFoundResponse)]);
                } else {
                    server.put('/users/user-id', {name: 'a'}).reply(401, notFoundResponse);
                }
                client.users('user-id').update({
                    entity: {name: 'a'},
                    engine: server.xhr
                }).then(null, function (error) {
                    if (isBrowser) {
                        expect(server.requests[0].requestBody).to.equal(JSON.stringify({
                            name: 'a'
                        }));
                    }
                    expect(error.status.code).to.equal(401);
                    expect(error.entity).to.deep.equal(notFoundResponse);
                    done();
                });
            });

            it('Should fail when we receive a 401 unauthorized', function (done) {
                if (isBrowser) {
                    server.respondWith('put', baseUrl + '/users/user-id',
                        [401, {'Content-Type': 'application/json'}, JSON.stringify(unauthorizedResponse)]);
                } else {
                    server.put('/users/user-id', {name: 'a'}).reply(401, unauthorizedResponse);
                }
                client.users('user-id').update({
                    entity: {name: 'a'},
                    engine: server.xhr
                }).then(null, function (error) {
                    if (isBrowser) {
                        expect(server.requests[0].requestBody).to.equal(JSON.stringify({
                            name: 'a'
                        }));
                    }
                    expect(error.status.code).to.equal(401);
                    expect(error.entity).to.deep.equal(unauthorizedResponse);
                    done();
                });
            });

            it('Can update an exiting user', function (done) {
                if (isBrowser) {
                    server.respondWith('put', baseUrl + '/users/user-id',
                        [200, {'Content-Type': 'application/json'}, JSON.stringify(user)]);
                } else {
                    server.put('/users/user-id', {name: 'a'}).reply(200, user);
                }
                client.users('user-id').update({
                    entity: {name: 'a'},
                    engine: server.xhr
                }).then(function (error) {
                    if (isBrowser) {
                        expect(server.requests[0].requestBody).to.equal(JSON.stringify({
                            name: 'a'
                        }));
                    }
                    expect(error.status.code).to.equal(200);
                    expect(error.entity).to.deep.equal(user);
                    done();
                });
            });
        });
    });
})();