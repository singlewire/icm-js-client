Promise = require 'promise'
assert = require 'assert'
request = require 'request'
_ = require 'lodash'

genReqFn = (path, http, config, method, paginate, options) ->
  get = (params) ->
    uri = "#{config?.url or 'https://api.singlewire.com'}/api/v1-DEV#{path}"
    requestParams = _.merge {}, (unless options.notJSON then {json: true}), params
    requestMethod = http[method.toLowerCase()]

    new Promise (resolve, reject) ->
      requestMethod uri, requestParams, (error, httpResponse, response) ->
        if not error and httpResponse.statusCode == 200
          if paginate
            response.hasNextPage = if response.next then true else false
            response.getNextPage = if response.next then _.partial(get, _.merge(params, form: start: response.next)) else _.noop
          resolve response
        else
          reject [error, httpResponse, response]
  get

defSubResource = (basePath, http, config) ->
  (path, optionsOrCallback, callback) ->
    defResource "#{basePath}#{path}", http, config, optionsOrCallback, callback

defResource = (path, http, config, optsOrCallback, callback) ->
  (id) ->
    opts = if _.isObject(optsOrCallback) then optsOrCallback else {}
    if id
      subPath = "#{path}/#{id}"
      subResources = {}
      if _.isFunction optsOrCallback
        subResources = optsOrCallback defSubResource(subPath, http, config)
      else if _.isFunction callback
        subResources = callback defSubResource(subPath, http, config)
      _.merge {},
        (if not _.contains(opts.exclude, 'show') then show: genReqFn(subPath, http, config, 'GET', false, opts)),
        (if not _.contains(opts.exclude, 'remove') then remove: genReqFn(subPath, http, config, 'DEL', false, opts)),
        (if not _.contains(opts.exclude, 'update') then update: genReqFn(subPath, http, config, 'PUT', false, opts)),
        subResources
    else
      _.merge {},
        (if opts.noId then get: genReqFn(path, http, config, 'GET', false, opts)),
        (if not _.contains(opts.exclude, 'list') then list: genReqFn(path, http, config, 'GET', true, opts)),
        (if not _.contains(opts.exclude, 'create') then create: genReqFn(path, http, config, 'POST', false, opts))

ICMClient = (config) ->
  assert config, 'Config object must be present'
  assert config.token, 'Token must be present in config'

  http = request.defaults _.merge {}, config.requestDefaults,
    headers:
      'X-Client-Version': 'NodejsClient 0.0.1'
      Authorization: "Bearer #{config.token}"

  users: defResource '/users', http, config, (subResource) ->
    subscriptions: subResource '/subscriptions'
    devices: subResource '/devices'
    tokens: subResource '/tokens', exclude: ['update']
    notifications: subResource '/notifications', exclude: ['update', 'create'], (subResource) ->
      audio: subResource '/audio', exclude: ['update', 'create', 'remove', 'list', 'show'], noId: true, notJSON: true
      image: subResource '/image', exclude: ['update', 'create', 'remove', 'list', 'show'], noId: true, notJSON: true
      activities: subResource '/activities', exclude: ['update', 'remove']
    securityGroups: subResource '/security-groups'
    userPermissions: subResource '/user-permissions'

  securityGroups: defResource '/security-groups', http, config, (subResource) ->
    members: subResource '/members'
    permissions: subResource '/permissions'

  messageTemplates: defResource '/message-templates', http, config, (subResource) ->
    audio: subResource '/audio', exclude: ['update', 'create', 'remove', 'list', 'show'], noId: true, notJSON: true
    image: subResource '/image', exclude: ['update', 'create', 'remove', 'list', 'show'], noId: true, notJSON: true

  confirmationRequests: defResource '/confirmation-requests', (subResource) ->
    escalationRules: subResource '/escalation-rules'

  notifications: defResource '/notifications', http, config, (subResource) ->
    audio: subResource '/audio', exclude: ['update', 'create', 'remove', 'list', 'show'], noId: true, notJSON: true
    image: subResource '/image', exclude: ['update', 'create', 'remove', 'list', 'show'], noId: true, notJSON: true
    activities: subResource '/activities', exclude: ['update', 'remove']
    recipients: subResource '/recipients', exclude: ['update', 'create', 'remove']

  distributionLists: defResource '/distribution-lists', http, config, (subResource) ->
    userSubscriptions: subResource '/user-subscriptions'

  loadDefinitions: defResource '/load-definitions', http, config, (subResource) ->
    securityGroupMappings: subResource '/security-group-mappings'
    distributionListMappings: subResource '/distribution-list-mappings'
    loadRequests: subResource '/load-requests', exclude: ['update', 'remove']

  session: defResource '/session', http, config, exclude: ['update', 'create', 'remove', 'list', 'show'], noId: true

  paginate: (promise, successCallback, errorCallback) ->
    self = this
    promise.then (response) ->
      shouldContinue = successCallback? response
      if shouldContinue and response.hasNextPage
        self.paginate response.getNextPage(), successCallback, errorCallback
    , (error) ->
      errorCallback? error

module.exports = ICMClient