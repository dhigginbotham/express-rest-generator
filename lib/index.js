const bodyParser = require('body-parser');
const log = require('debug')('rest:'); // eslint-disable-line
const { slugify, toNum, omit } = require('./helpers');

const defaults = {
  path: null,
  key: 'collection',
  privatesKey: null,
  initializers: [],
  mutators: [],
  model: null,
  statics: null,
  pageSizeMax: 500,
  pageSizeDefault: 20,
  sortBy: '-_id',
  supports: ['post', 'patch', 'put', 'get', 'delete']
};

const Rest = function(opts, app) {
  if (!(this instanceof Rest)) return new Rest(opts, app);

  Object.assign(this, defaults);

  // extend options
  if (opts) Object.assign(this, opts);

  if (!this.path) this.path = `/${this.model.modelName.toLowerCase()}`;

  // used by `mutatePrivateKeys`, looks onto the model for
  // a static with provided key
  if (!this.privatesKey) this.privatesKey = 'privateKeys';

  // initializes collection array
  this.initializer = function(req, res, next) {
    req[this.key] = !Array.isArray(req[this.key])
      ? []
      : req[this.key];
    return next();
  }.bind(this);

  // autogenerate routes from model statics,
  // expects express style middleware
  this.generateStatics = function() {
    if (!this.model.hasOwnProperty(this.statics)) return null;
    function generator(router, key) {
      const route = slugify(key);
      const url = `${this.path}/${route}/:id?`;
      router.use(
        url,
        bodyParser.json(),
        this.initializer,
        this.initializers,
        this.model[this.statics][key],
        this.mutators,
        this.mutatePrivateKeys,
        this.endpoint
      );
      return router;
    }
    return Object
      .keys(this.model[this.statics])
      .reduce(generator.bind(this), require('express').Router()); // eslint-disable-line
  }.bind(this);

  // internal router mechanism to determine which request
  // to handle
  this.router = function(req, res, next) {
    const method = req.method.toLowerCase();
    if (this.supports.indexOf(method) === -1) return res.status(400).json({ message: 'This HTTP Method is unsuported' });
    function defaultCallback(err, resp) {
      const { message = 'There was an error processing your request.' } = err || {};
      if (err) return res.status(400).json({ message });
      req[this.key].push(resp);
      return next();
    }
    return this[method](req, res, defaultCallback.bind(this));
  }.bind(this);

  // mutates query to hide private keys
  this.mutatePrivateKeys = function(req, res, next) {
    if (!req[this.key].length) return next();
    const keys = Array.isArray(this.model[this.privatesKey])
      ? this.model[this.privatesKey]
      : [];
    if (!keys.length) return next();
    req[this.key] = req[this.key]
      .map(wrapper => wrapper
        .map(collection => omit(collection._doc, keys)))
      .shift();
    return next();
  }.bind(this);

  // endpoint for json responses
  this.endpoint = function(req, res) {
    return res.json(req[this.key].length === 1
      ? req[this.key][0]
      : req[this.key]);
  }.bind(this);

  // autowire subapp by passing app const
  if (this.statics) app.use(this.generateStatics());
  if (app) return this.mount(app);
  return this;
};

/**
 * creates a new document
 * @param  {Object}   req request object supplied by express
 * @param  {Function} fn  callback function
 */
Rest.prototype.createDocument = function(req, res, fn) {
  if (!Object.keys(req.body).length) return fn(null, { message: 'Missing required post body' });
  const newCollection = new this.model(req.body);
  return newCollection.save(fn);
};

/**
 * updates any given object
 * @param  {Object}   req request object supplied by express
 * @param  {Function} fn  callback function
 * @return {Function} updated document
 */
Rest.prototype.updateDocument = function(req, res, fn) {
  if (!Object.keys(req.body).length) return fn(null, { message: 'Missing required post body' });
  const id = req.params.id ? req.params.id : null;
  const update = omit(req.body, '_id');
  return this.model.findById(id, (err, doc) => {
    if (err) return fn(err, null);
    Object.assign(doc, update);
    return doc.save(fn);
  });
};

/**
 * mount application to express
 * @param  {Object} app express application object
 */
Rest.prototype.mount = function(app) {
  const url = `${this.path}/:id?`;
  app.use(
    url,
    bodyParser.json(),
    this.initializer,
    this.initializers,
    this.router,
    this.mutators,
    this.mutatePrivateKeys,
    this.endpoint
  );
  return this;
};

/**
 * get method
 * @param  {Object}   req request object supplied by express
 * @param  {Function} fn  callback function
 */
Rest.prototype.get = function(req, res, fn) {
  const { params = {}, query = {} } = req;
  const { id = null } = params;
  let { limit = this.pageSizeDefault, page = 0 } = query;
  const { sort = this.sortBy } = query;
  limit = Math.min(this.pageSizeMax, toNum(limit));
  page = toNum(page);
  const search = id ? { _id: id } : {};
  return this.model
    .find(Object.assign(search, omit(query, ['page', 'limit', 'sort'])))
    .sort(sort)
    .limit(limit)
    .skip(page > 0 ? (page - 1) * limit : 0)
    .execAsync()
    .catch(fn)
    .then(fn.bind(null, null));
};

/**
 * post method
 * @param  {Object}   req request object supplied by express
 * @param  {Function} fn  callback function
 */
Rest.prototype.post = function(req, res, fn) {
  return this[`${req.params.id ? 'update' : 'create'}Document`](req, res, fn);
};

/**
 * patch/put method
 * @param  {Object}   req request object supplied by express
 * @param  {Function} fn  callback function
 */
Rest.prototype.put = function(req, res, fn) {
  if (req.params.id) return this.updateDocument(req, res, fn);
  return fn(null, { message: 'A valid id is required for this type of request' });
};

Rest.prototype.patch = Rest.prototype.put;

/**
 * delete method
 * @param  {Object}   req request object supplied by express
 * @param  {Function} fn  callback function
 */
Rest.prototype.delete = function(req, res, fn) {
  const id = (req.params.id ? { _id: req.params.id } : null);
  return this.model.remove(id, fn);
};

module.exports = Rest;
