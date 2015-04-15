if (typeof process !== 'undefined' && typeof module !== 'undefined' && module.exports) {
    ICMClient = require('../src/app');
    expect = require('chai').expect;
    isBrowser = false;
} else {
    expect = chai.expect;
    isBrowser = true;
}

describe('InformaCast Mobile REST Client', function () {
    describe('ICMClient constructor', function () {
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

    describe('Paths are defined correctly', function () {
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
});