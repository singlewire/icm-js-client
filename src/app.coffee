assert = require 'assert'
_ = require 'lodash'
rest = require 'rest'
mime = require 'rest/interceptor/mime'
errorCode = require 'rest/interceptor/errorCode'
defaultRequest = require 'rest/interceptor/defaultRequest'

genReqFn = (path, client, config, method, opts) ->
  (params) ->
    fullUrl = "#{config.baseApiUrl}#{path}"
    requestParams = _.merge {method: method, path: fullUrl},
      (unless opts.notJSON then headers: 'Content-Type': 'application/json'),
      params
    client requestParams

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
        (if not _.contains(opts.exclude, 'show') then show: genReqFn(subPath, http, config, 'GET', opts)),
        (if not _.contains(opts.exclude, 'remove') then remove: genReqFn(subPath, http, config, 'DELETE', opts)),
        (if not _.contains(opts.exclude, 'update') then update: genReqFn(subPath, http, config, 'PUT', opts)),
        subResources
    else
      _.merge {},
        (if opts.noId then get: genReqFn(path, http, config, 'GET', opts)),
        (if not _.contains(opts.exclude, 'list') then list: genReqFn(path, http, config, 'GET', opts)),
        (if not _.contains(opts.exclude, 'create') then create: genReqFn(path, http, config, 'POST', opts))

ICMClient = (config) ->
  config = _.cloneDeep config
  assert config, 'Config object must be present'
  assert config.token, 'Token must be present in config'

  config.baseApiUrl = "#{config?.url or 'https://api.singlewire.com'}/api/v1-DEV"

  http = rest.wrap mime
  .wrap errorCode
  .wrap defaultRequest,
    headers:
      'X-Client-Version': 'JSClient 0.0.1'
      Authorization: "Bearer #{config.token}"
      Accept: 'application/json'

  http = if _.isFunction(config.clientSetup) then config.clientSetup(http) else http

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

  reports: defResource '/reports', http, config, exclude: ['update', 'create', 'remove']

  paginate: (promise, successCallback, errorCallback) ->
    self = this
    promise.then (response) ->
      shouldContinue = successCallback? response
      if shouldContinue and response.entity?.next
        client = response.request.originator
        originalRequestParams = _.omit response.request, 'cancel', 'canceled', 'originator'
        nextPageRequestParams = _.merge originalRequestParams, params: start: response.entity.next
        self.paginate client(nextPageRequestParams), successCallback, errorCallback
    , (error) ->
      errorCallback? error

module.exports = ICMClient