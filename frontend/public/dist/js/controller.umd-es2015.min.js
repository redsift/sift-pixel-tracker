(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.SiftPixelTracker = factory());
}(this, function () { 'use strict';

    /**
     * Observable pattern implementation.
     * Supports topics as String or an Array.
     */
    var Observable = function Observable() {
      this._observers = [];
    };

    Observable.prototype.subscribe = function subscribe (topic, observer) {
      this._op('_sub', topic, observer);
    };

    Observable.prototype.unsubscribe = function unsubscribe (topic, observer) {
      this._op('_unsub', topic, observer);
    };

    Observable.prototype.unsubscribeAll = function unsubscribeAll (topic) {
      if (!this._observers[topic]) {
        return;
      }
      delete this._observers[topic];
    };

    Observable.prototype.publish = function publish (topic, message) {
      this._op('_pub', topic, message);
    };

    /**
     * Internal methods
     */
    Observable.prototype._op = function _op (op, topic, value) {
        var this$1 = this;

      if (Array.isArray(topic)) {
        topic.forEach(function (t) {
          this$1[op](t, value);
        });
      }
      else {
        this[op](topic, value);
      }
    };

    Observable.prototype._sub = function _sub (topic, observer) {
      this._observers[topic] || (this._observers[topic] = []);
      this._observers[topic].push(observer);
    };

    Observable.prototype._unsub = function _unsub (topic, observer) {
      if (!this._observers[topic]) {
        return;
      }
      var index = this._observers[topic].indexOf(observer);
      if (~index) {
        this._observers[topic].splice(index, 1);
      }
    };

    Observable.prototype._pub = function _pub (topic, message) {
        var this$1 = this;

      if (!this._observers[topic]) {
        return;
      }
      for (var i = this._observers[topic].length - 1; i >= 0; i--) {
        this$1._observers[topic][i](message)
      }
    };

    var EmailClient = (function (Observable) {
      function EmailClient(proxy) {
        Observable.call(this);
        this._proxy = proxy;
      }

      if ( Observable ) EmailClient.__proto__ = Observable;
      EmailClient.prototype = Object.create( Observable && Observable.prototype );
      EmailClient.prototype.constructor = EmailClient;

      EmailClient.prototype.goto = function goto (params) {
        this._postMessage('goto', params);
      };

      EmailClient.prototype.close = function close () {
        this._postMessage('close');
      };

      EmailClient.prototype._postMessage = function _postMessage (topic, value) {
        this._proxy.postMessage({
          method: 'notifyClient',
          params: {
            topic: topic,
            value: value
          }
        });
      };

      return EmailClient;
    }(Observable));

    var SiftStorage = (function (Observable) {
      function SiftStorage() {
        Observable.call(this);
        this._treo = null;
      }

      if ( Observable ) SiftStorage.__proto__ = Observable;
      SiftStorage.prototype = Object.create( Observable && Observable.prototype );
      SiftStorage.prototype.constructor = SiftStorage;

      SiftStorage.prototype.init = function init (treo) {
        this._treo = treo;
      };

      SiftStorage.prototype.get = function get (d){ return this._treo.get(d)};
      SiftStorage.prototype.getIndexKeys = function getIndexKeys (d){ return this._treo.getIndexKeys(d)};
      SiftStorage.prototype.getIndex = function getIndex (d){ return this._treo.getIndex(d)};
      SiftStorage.prototype.getWithIndex = function getWithIndex (d){ return this._treo.getWithIndex(d)};
      SiftStorage.prototype.getAllKeys = function getAllKeys (d){ return this._treo.getAllKeys(d)};
      SiftStorage.prototype.getAll = function getAll (d){ return this._treo.getAll(d)};
      SiftStorage.prototype.getUser = function getUser (d){ return this._treo.getUser(d)};
      SiftStorage.prototype.putUser = function putUser (d){ return this._treo.putUser(d)};
      SiftStorage.prototype.delUser = function delUser (d){ return this._treo.delUser(d)};

      return SiftStorage;
    }(Observable));

    var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var index$2 = createCommonjsModule(function (module) {
    'use strict';
    var toString = Object.prototype.toString;

    module.exports = function (x) {
    	var prototype;
    	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
    };
    });

    var require$$0$2 = (index$2 && typeof index$2 === 'object' && 'default' in index$2 ? index$2['default'] : index$2);

    var index$1 = createCommonjsModule(function (module, exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = range;

    var _isPlainObj = require$$0$2;

    var _isPlainObj2 = _interopRequireDefault(_isPlainObj);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    /**
     * Parse `opts` to valid IDBKeyRange.
     * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
     *
     * @param {Object} opts
     * @return {IDBKeyRange}
     */

    function range(opts) {
      var IDBKeyRange = commonjsGlobal.IDBKeyRange || commonjsGlobal.webkitIDBKeyRange;
      if (opts instanceof IDBKeyRange) return opts;
      if (typeof opts === 'undefined' || opts === null) return null;
      if (!(0, _isPlainObj2.default)(opts)) return IDBKeyRange.only(opts);
      var keys = Object.keys(opts).sort();

      if (keys.length === 1) {
        var key = keys[0];
        var val = opts[key];

        switch (key) {
          case 'eq':
            return IDBKeyRange.only(val);
          case 'gt':
            return IDBKeyRange.lowerBound(val, true);
          case 'lt':
            return IDBKeyRange.upperBound(val, true);
          case 'gte':
            return IDBKeyRange.lowerBound(val);
          case 'lte':
            return IDBKeyRange.upperBound(val);
          default:
            throw new TypeError('"' + key + '" is not valid key');
        }
      } else {
        var x = opts[keys[0]];
        var y = opts[keys[1]];
        var pattern = keys.join('-');

        switch (pattern) {
          case 'gt-lt':
            return IDBKeyRange.bound(x, y, true, true);
          case 'gt-lte':
            return IDBKeyRange.bound(x, y, true, false);
          case 'gte-lt':
            return IDBKeyRange.bound(x, y, false, true);
          case 'gte-lte':
            return IDBKeyRange.bound(x, y, false, false);
          default:
            throw new TypeError('"' + pattern + '" are conflicted keys');
        }
      }
    }
    module.exports = exports['default'];
    });

    var require$$0$1 = (index$1 && typeof index$1 === 'object' && 'default' in index$1 ? index$1['default'] : index$1);

    var idbIndex = createCommonjsModule(function (module) {
    var parseRange = require$$0$1;

    /**
     * Expose `Index`.
     */

    module.exports = Index;

    /**
     * Initialize new `Index`.
     *
     * @param {Store} store
     * @param {String} name
     * @param {String|Array} field
     * @param {Object} opts { unique: false, multi: false }
     */

    function Index(store, name, field, opts) {
      this.store = store;
      this.name = name;
      this.field = field;
      this.opts = opts;
      this.multi = opts.multi || opts.multiEntry || false;
      this.unique = opts.unique || false;
    }

    /**
     * Get `key`.
     *
     * @param {Object|IDBKeyRange} key
     * @param {Function} cb
     */

    Index.prototype.get = function(key, cb) {
      var result = [];
      var isUnique = this.unique;
      var opts = { range: key, iterator: iterator };

      this.cursor(opts, function(err) {
        if (err) return cb(err);
        isUnique ? cb(null, result[0]) : cb(null, result);
      });

      function iterator(cursor) {
        result.push(cursor.value);
        cursor.continue();
      }
    };

    /**
     * Count records by `key`.
     *
     * @param {String|IDBKeyRange} key
     * @param {Function} cb
     */

    Index.prototype.count = function(key, cb) {
      var name = this.store.name;
      var indexName = this.name;

      this.store.db.transaction('readonly', [name], function(err, tr) {
        if (err) return cb(err);
        var index = tr.objectStore(name).index(indexName);
        var req = index.count(parseRange(key));
        req.onerror = cb;
        req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
      });
    };

    /**
     * Create cursor.
     * Proxy to `this.store` for convinience.
     *
     * @param {Object} opts
     * @param {Function} cb
     */

    Index.prototype.cursor = function(opts, cb) {
      opts.index = this.name;
      this.store.cursor(opts, cb);
    };
    });

    var require$$0 = (idbIndex && typeof idbIndex === 'object' && 'default' in idbIndex ? idbIndex['default'] : idbIndex);

    var index$3 = createCommonjsModule(function (module) {
    /**
     * toString ref.
     */

    var toString = Object.prototype.toString;

    /**
     * Return the type of `val`.
     *
     * @param {Mixed} val
     * @return {String}
     * @api public
     */

    module.exports = function(val){
      switch (toString.call(val)) {
        case '[object Date]': return 'date';
        case '[object RegExp]': return 'regexp';
        case '[object Arguments]': return 'arguments';
        case '[object Array]': return 'array';
        case '[object Error]': return 'error';
      }

      if (val === null) return 'null';
      if (val === undefined) return 'undefined';
      if (val !== val) return 'nan';
      if (val && val.nodeType === 1) return 'element';

      val = val.valueOf
        ? val.valueOf()
        : Object.prototype.valueOf.apply(val)

      return typeof val;
    };
    });

    var require$$2 = (index$3 && typeof index$3 === 'object' && 'default' in index$3 ? index$3['default'] : index$3);

    var idbStore = createCommonjsModule(function (module) {
    var type = require$$2;
    var parseRange = require$$0$1;

    /**
     * Expose `Store`.
     */

    module.exports = Store;

    /**
     * Initialize new `Store`.
     *
     * @param {String} name
     * @param {Object} opts
     */

    function Store(name, opts) {
      this.db = null;
      this.name = name;
      this.indexes = {};
      this.opts = opts;
      this.key = opts.key || opts.keyPath || undefined;
      this.increment = opts.increment || opts.autoIncretement || undefined;
    }

    /**
     * Get index by `name`.
     *
     * @param {String} name
     * @return {Index}
     */

    Store.prototype.index = function(name) {
      return this.indexes[name];
    };

    /**
     * Put (create or replace) `key` to `val`.
     *
     * @param {String|Object} [key] is optional when store.key exists.
     * @param {Any} val
     * @param {Function} cb
     */

    Store.prototype.put = function(key, val, cb) {
      var name = this.name;
      var keyPath = this.key;
      if (keyPath) {
        if (type(key) == 'object') {
          cb = val;
          val = key;
          key = null;
        } else {
          val[keyPath] = key;
        }
      }

      this.db.transaction('readwrite', [name], function(err, tr) {
        if (err) return cb(err);
        var objectStore = tr.objectStore(name);
        var req = keyPath ? objectStore.put(val) : objectStore.put(val, key);
        tr.onerror = tr.onabort = req.onerror = cb;
        tr.oncomplete = function oncomplete() { cb(null, req.result) };
      });
    };

    /**
     * Get `key`.
     *
     * @param {String} key
     * @param {Function} cb
     */

    Store.prototype.get = function(key, cb) {
      var name = this.name;
      this.db.transaction('readonly', [name], function(err, tr) {
        if (err) return cb(err);
        var objectStore = tr.objectStore(name);
        var req = objectStore.get(key);
        req.onerror = cb;
        req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
      });
    };

    /**
     * Del `key`.
     *
     * @param {String} key
     * @param {Function} cb
     */

    Store.prototype.del = function(key, cb) {
      var name = this.name;
      this.db.transaction('readwrite', [name], function(err, tr) {
        if (err) return cb(err);
        var objectStore = tr.objectStore(name);
        var req = objectStore.delete(key);
        tr.onerror = tr.onabort = req.onerror = cb;
        tr.oncomplete = function oncomplete() { cb() };
      });
    };

    /**
     * Count.
     *
     * @param {Function} cb
     */

    Store.prototype.count = function(cb) {
      var name = this.name;
      this.db.transaction('readonly', [name], function(err, tr) {
        if (err) return cb(err);
        var objectStore = tr.objectStore(name);
        var req = objectStore.count();
        req.onerror = cb;
        req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
      });
    };

    /**
     * Clear.
     *
     * @param {Function} cb
     */

    Store.prototype.clear = function(cb) {
      var name = this.name;
      this.db.transaction('readwrite', [name], function(err, tr) {
        if (err) return cb(err);
        var objectStore = tr.objectStore(name);
        var req = objectStore.clear();
        tr.onerror = tr.onabort = req.onerror = cb;
        tr.oncomplete = function oncomplete() { cb() };
      });
    };

    /**
     * Perform batch operation.
     *
     * @param {Object} vals
     * @param {Function} cb
     */

    Store.prototype.batch = function(vals, cb) {
      var name = this.name;
      var keyPath = this.key;
      var keys = Object.keys(vals);

      this.db.transaction('readwrite', [name], function(err, tr) {
        if (err) return cb(err);
        var store = tr.objectStore(name);
        var current = 0;
        tr.onerror = tr.onabort = cb;
        tr.oncomplete = function oncomplete() { cb() };
        next();

        function next() {
          if (current >= keys.length) return;
          var currentKey = keys[current];
          var currentVal = vals[currentKey];
          var req;

          if (currentVal === null) {
            req = store.delete(currentKey);
          } else if (keyPath) {
            if (!currentVal[keyPath]) currentVal[keyPath] = currentKey;
            req = store.put(currentVal);
          } else {
            req = store.put(currentVal, currentKey);
          }

          req.onerror = cb;
          req.onsuccess = next;
          current += 1;
        }
      });
    };

    /**
     * Get all.
     *
     * @param {Function} cb
     */

    Store.prototype.all = function(cb) {
      var result = [];

      this.cursor({ iterator: iterator }, function(err) {
        err ? cb(err) : cb(null, result);
      });

      function iterator(cursor) {
        result.push(cursor.value);
        cursor.continue();
      }
    };

    /**
     * Create read cursor for specific `range`,
     * and pass IDBCursor to `iterator` function.
     * https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor
     *
     * @param {Object} opts:
     *   {IDBRange|Object} range - passes to .openCursor()
     *   {Function} iterator - function to call with IDBCursor
     *   {String} [index] - name of index to start cursor by index
     * @param {Function} cb - calls on end or error
     */

    Store.prototype.cursor = function(opts, cb) {
      var name = this.name;
      this.db.transaction('readonly', [name], function(err, tr) {
        if (err) return cb(err);
        var store = opts.index
          ? tr.objectStore(name).index(opts.index)
          : tr.objectStore(name);
        var req = store.openCursor(parseRange(opts.range));

        req.onerror = cb;
        req.onsuccess = function onsuccess(e) {
          var cursor = e.target.result;
          cursor ? opts.iterator(cursor) : cb();
        };
      });
    };
    });

    var require$$1 = (idbStore && typeof idbStore === 'object' && 'default' in idbStore ? idbStore['default'] : idbStore);

    var schema$1 = createCommonjsModule(function (module) {
    var type = require$$2;
    var Store = require$$1;
    var Index = require$$0;

    /**
     * Expose `Schema`.
     */

    module.exports = Schema;

    /**
     * Initialize new `Schema`.
     */

    function Schema() {
      if (!(this instanceof Schema)) return new Schema();
      this._stores = {};
      this._current = {};
      this._versions = {};
    }

    /**
     * Set new version.
     *
     * @param {Number} version
     * @return {Schema}
     */

    Schema.prototype.version = function(version) {
      if (type(version) != 'number' || version < 1 || version < this.getVersion())
        throw new TypeError('not valid version');

      this._current = { version: version, store: null };
      this._versions[version] = {
        stores: [],      // db.createObjectStore
        dropStores: [],  // db.deleteObjectStore
        indexes: [],     // store.createIndex
        dropIndexes: [], // store.deleteIndex
        version: version // version
      };

      return this;
    };

    /**
     * Add store.
     *
     * @param {String} name
     * @param {Object} [opts] { key: false }
     * @return {Schema}
     */

    Schema.prototype.addStore = function(name, opts) {
      if (type(name) != 'string') throw new TypeError('`name` is required');
      if (this._stores[name]) throw new TypeError('store is already defined');
      var store = new Store(name, opts || {});
      this._stores[name] = store;
      this._versions[this.getVersion()].stores.push(store);
      this._current.store = store;
      return this;
    };

    /**
     * Drop store.
     *
     * @param {String} name
     * @return {Schema}
     */

    Schema.prototype.dropStore = function(name) {
      if (type(name) != 'string') throw new TypeError('`name` is required');
      var store = this._stores[name];
      if (!store) throw new TypeError('store is not defined');
      delete this._stores[name];
      this._versions[this.getVersion()].dropStores.push(store);
      return this;
    };

    /**
     * Add index.
     *
     * @param {String} name
     * @param {String|Array} field
     * @param {Object} [opts] { unique: false, multi: false }
     * @return {Schema}
     */

    Schema.prototype.addIndex = function(name, field, opts) {
      if (type(name) != 'string') throw new TypeError('`name` is required');
      if (type(field) != 'string' && type(field) != 'array') throw new TypeError('`field` is required');
      var store = this._current.store;
      if (store.indexes[name]) throw new TypeError('index is already defined');
      var index = new Index(store, name, field, opts || {});
      store.indexes[name] = index;
      this._versions[this.getVersion()].indexes.push(index);
      return this;
    };

    /**
     * Drop index.
     *
     * @param {String} name
     * @return {Schema}
     */

    Schema.prototype.dropIndex = function(name) {
      if (type(name) != 'string') throw new TypeError('`name` is required');
      var index = this._current.store.indexes[name];
      if (!index) throw new TypeError('index is not defined');
      delete this._current.store.indexes[name];
      this._versions[this.getVersion()].dropIndexes.push(index);
      return this;
    };

    /**
     * Change current store.
     *
     * @param {String} name
     * @return {Schema}
     */

    Schema.prototype.getStore = function(name) {
      if (type(name) != 'string') throw new TypeError('`name` is required');
      if (!this._stores[name]) throw new TypeError('store is not defined');
      this._current.store = this._stores[name];
      return this;
    };

    /**
     * Get version.
     *
     * @return {Number}
     */

    Schema.prototype.getVersion = function() {
      return this._current.version;
    };

    /**
     * Generate onupgradeneeded callback.
     *
     * @return {Function}
     */

    Schema.prototype.callback = function() {
      var versions = Object.keys(this._versions)
        .map(function(v) { return this._versions[v] }, this)
        .sort(function(a, b) { return a.version - b.version });

      return function onupgradeneeded(e) {
        var db = e.target.result;
        var tr = e.target.transaction;

        versions.forEach(function(versionSchema) {
          if (e.oldVersion >= versionSchema.version) return;

          versionSchema.stores.forEach(function(s) {
            var options = {};

            // Only pass the options that are explicitly specified to createObjectStore() otherwise IE/Edge
            // can throw an InvalidAccessError - see https://msdn.microsoft.com/en-us/library/hh772493(v=vs.85).aspx
            if (typeof s.key !== 'undefined') options.keyPath = s.key;
            if (typeof s.increment !== 'undefined') options.autoIncrement = s.increment;

            db.createObjectStore(s.name, options);
          });

          versionSchema.dropStores.forEach(function(s) {
            db.deleteObjectStore(s.name);
          });

          versionSchema.indexes.forEach(function(i) {
            var store = tr.objectStore(i.store.name);
            store.createIndex(i.name, i.field, {
              unique: i.unique,
              multiEntry: i.multi
            });
          });

          versionSchema.dropIndexes.forEach(function(i) {
            var store = tr.objectStore(i.store.name);
            store.deleteIndex(i.name);
          });
        });
      };
    };
    });

    var require$$2$1 = (schema$1 && typeof schema$1 === 'object' && 'default' in schema$1 ? schema$1['default'] : schema$1);

    var index = createCommonjsModule(function (module, exports) {
    var type = require$$2;
    var Schema = require$$2$1;
    var Store = require$$1;
    var Index = require$$0;

    /**
     * Expose `Treo`.
     */

    exports = module.exports = Treo;

    /**
     * Initialize new `Treo` instance.
     *
     * @param {String} name
     * @param {Schema} schema
     */

    function Treo(name, schema) {
      if (!(this instanceof Treo)) return new Treo(name, schema);
      if (type(name) != 'string') throw new TypeError('`name` required');
      if (!(schema instanceof Schema)) throw new TypeError('not valid schema');

      this.name = name;
      this.status = 'close';
      this.origin = null;
      this.stores = schema._stores;
      this.version = schema.getVersion();
      this.onupgradeneeded = schema.callback();

      // assign db property to each store
      Object.keys(this.stores).forEach(function(storeName) {
        this.stores[storeName].db = this;
      }, this);
    }

    /**
     * Expose core classes.
     */

    exports.schema = Schema;
    exports.cmp = cmp;
    exports.Treo = Treo;
    exports.Schema = Schema;
    exports.Store = Store;
    exports.Index = Index;

    /**
     * Use plugin `fn`.
     *
     * @param {Function} fn
     * @return {Treo}
     */

    Treo.prototype.use = function(fn) {
      fn(this, exports);
      return this;
    };

    /**
     * Drop.
     *
     * @param {Function} cb
     */

    Treo.prototype.drop = function(cb) {
      var name = this.name;
      this.close(function(err) {
        if (err) return cb(err);
        var req = indexedDB().deleteDatabase(name);
        req.onerror = cb;
        req.onsuccess = function onsuccess() { cb() };
      });
    };

    /**
     * Close.
     *
     * @param {Function} cb
     */

    Treo.prototype.close = function(cb) {
      if (this.status == 'close') return cb();
      this.getInstance(function(err, db) {
        if (err) return cb(err);
        db.origin = null;
        db.status = 'close';
        db.close();
        cb();
      });
    };

    /**
     * Get store by `name`.
     *
     * @param {String} name
     * @return {Store}
     */

    Treo.prototype.store = function(name) {
      return this.stores[name];
    };

    /**
     * Get db instance. It starts opening transaction only once,
     * another requests will be scheduled to queue.
     *
     * @param {Function} cb
     */

    Treo.prototype.getInstance = function(cb) {
      if (this.status == 'open') return cb(null, this.origin);
      if (this.status == 'opening') return this.queue.push(cb);

      this.status = 'opening';
      this.queue = [cb]; // queue callbacks

      var that = this;
      var req = indexedDB().open(this.name, this.version);
      req.onupgradeneeded = this.onupgradeneeded;

      req.onerror = req.onblocked = function onerror(e) {
        that.status = 'error';
        that.queue.forEach(function(cb) { cb(e) });
        delete that.queue;
      };

      req.onsuccess = function onsuccess(e) {
        that.origin = e.target.result;
        that.status = 'open';
        that.origin.onversionchange = function onversionchange() {
          that.close(function() {});
        };
        that.queue.forEach(function(cb) { cb(null, that.origin) });
        delete that.queue;
      };
    };

    /**
     * Create new transaction for selected `stores`.
     *
     * @param {String} type (readwrite|readonly)
     * @param {Array} stores - follow indexeddb semantic
     * @param {Function} cb
     */

    Treo.prototype.transaction = function(type, stores, cb) {
      this.getInstance(function(err, db) {
        err ? cb(err) : cb(null, db.transaction(stores, type));
      });
    };

    /**
     * Compare 2 values using IndexedDB comparision algotihm.
     *
     * @param {Mixed} value1
     * @param {Mixed} value2
     * @return {Number} -1|0|1
     */

    function cmp() {
      return indexedDB().cmp.apply(indexedDB(), arguments);
    }

    /**
     * Dynamic link to `global.indexedDB` for polyfills support.
     *
     * @return {IDBDatabase}
     */

    function indexedDB() {
      return commonjsGlobal._indexedDB
        || commonjsGlobal.indexedDB
        || commonjsGlobal.msIndexedDB
        || commonjsGlobal.mozIndexedDB
        || commonjsGlobal.webkitIndexedDB;
    }
    });

    var treo = (index && typeof index === 'object' && 'default' in index ? index['default'] : index);

    var loglevel = createCommonjsModule(function (module) {
    /*
    * loglevel - https://github.com/pimterry/loglevel
    *
    * Copyright (c) 2013 Tim Perry
    * Licensed under the MIT license.
    */
    (function (root, definition) {
        "use strict";
        if (typeof define === 'function' && define.amd) {
            define(definition);
        } else if (typeof module === 'object' && module.exports) {
            module.exports = definition();
        } else {
            root.log = definition();
        }
    }(commonjsGlobal, function () {
        "use strict";
        var noop = function() {};
        var undefinedType = "undefined";

        function realMethod(methodName) {
            if (typeof console === undefinedType) {
                return false; // We can't build a real method without a console to log to
            } else if (console[methodName] !== undefined) {
                return bindMethod(console, methodName);
            } else if (console.log !== undefined) {
                return bindMethod(console, 'log');
            } else {
                return noop;
            }
        }

        function bindMethod(obj, methodName) {
            var method = obj[methodName];
            if (typeof method.bind === 'function') {
                return method.bind(obj);
            } else {
                try {
                    return Function.prototype.bind.call(method, obj);
                } catch (e) {
                    // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                    return function() {
                        return Function.prototype.apply.apply(method, [obj, arguments]);
                    };
                }
            }
        }

        // these private functions always need `this` to be set properly

        function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
            return function () {
                if (typeof console !== undefinedType) {
                    replaceLoggingMethods.call(this, level, loggerName);
                    this[methodName].apply(this, arguments);
                }
            };
        }

        function replaceLoggingMethods(level, loggerName) {
            var this$1 = this;

            /*jshint validthis:true */
            for (var i = 0; i < logMethods.length; i++) {
                var methodName = logMethods[i];
                this$1[methodName] = (i < level) ?
                    noop :
                    this$1.methodFactory(methodName, level, loggerName);
            }
        }

        function defaultMethodFactory(methodName, level, loggerName) {
            /*jshint validthis:true */
            return realMethod(methodName) ||
                   enableLoggingWhenConsoleArrives.apply(this, arguments);
        }

        var logMethods = [
            "trace",
            "debug",
            "info",
            "warn",
            "error"
        ];

        function Logger(name, defaultLevel, factory) {
          var self = this;
          var currentLevel;
          var storageKey = "loglevel";
          if (name) {
            storageKey += ":" + name;
          }

          function persistLevelIfPossible(levelNum) {
              var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

              // Use localStorage if available
              try {
                  window.localStorage[storageKey] = levelName;
                  return;
              } catch (ignore) {}

              // Use session cookie as fallback
              try {
                  window.document.cookie =
                    encodeURIComponent(storageKey) + "=" + levelName + ";";
              } catch (ignore) {}
          }

          function getPersistedLevel() {
              var storedLevel;

              try {
                  storedLevel = window.localStorage[storageKey];
              } catch (ignore) {}

              if (typeof storedLevel === undefinedType) {
                  try {
                      var cookie = window.document.cookie;
                      var location = cookie.indexOf(
                          encodeURIComponent(storageKey) + "=");
                      if (location) {
                          storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                      }
                  } catch (ignore) {}
              }

              // If the stored level is not valid, treat it as if nothing was stored.
              if (self.levels[storedLevel] === undefined) {
                  storedLevel = undefined;
              }

              return storedLevel;
          }

          /*
           *
           * Public API
           *
           */

          self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
              "ERROR": 4, "SILENT": 5};

          self.methodFactory = factory || defaultMethodFactory;

          self.getLevel = function () {
              return currentLevel;
          };

          self.setLevel = function (level, persist) {
              if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
                  level = self.levels[level.toUpperCase()];
              }
              if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
                  currentLevel = level;
                  if (persist !== false) {  // defaults to true
                      persistLevelIfPossible(level);
                  }
                  replaceLoggingMethods.call(self, level, name);
                  if (typeof console === undefinedType && level < self.levels.SILENT) {
                      return "No console available for logging";
                  }
              } else {
                  throw "log.setLevel() called with invalid level: " + level;
              }
          };

          self.setDefaultLevel = function (level) {
              if (!getPersistedLevel()) {
                  self.setLevel(level, false);
              }
          };

          self.enableAll = function(persist) {
              self.setLevel(self.levels.TRACE, persist);
          };

          self.disableAll = function(persist) {
              self.setLevel(self.levels.SILENT, persist);
          };

          // Initialize with the right level
          var initialLevel = getPersistedLevel();
          if (initialLevel == null) {
              initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
          }
          self.setLevel(initialLevel, false);
        }

        /*
         *
         * Package-level API
         *
         */

        var defaultLogger = new Logger();

        var _loggersByName = {};
        defaultLogger.getLogger = function getLogger(name) {
            if (typeof name !== "string" || name === "") {
              throw new TypeError("You must supply a name when creating a logger.");
            }

            var logger = _loggersByName[name];
            if (!logger) {
              logger = _loggersByName[name] = new Logger(
                name, defaultLogger.getLevel(), defaultLogger.methodFactory);
            }
            return logger;
        };

        // Grab the current global log variable in case of overwrite
        var _log = (typeof window !== undefinedType) ? window.log : undefined;
        defaultLogger.noConflict = function() {
            if (typeof window !== undefinedType &&
                   window.log === defaultLogger) {
                window.log = _log;
            }

            return defaultLogger;
        };

        return defaultLogger;
    }));
    });

    var loglevel$1 = (loglevel && typeof loglevel === 'object' && 'default' in loglevel ? loglevel['default'] : loglevel);

    // Email msg buckets
    var EMAIL_ID_BUCKET = '_email.id';
    var EMAIL_TID_BUCKET = '_email.tid';
    var SPECIAL_BUCKETS = ['_id.list', '_tid.list', EMAIL_ID_BUCKET, EMAIL_TID_BUCKET];

    var SYNC_DB_PREFIX = 'rs_sync_log';
    var SYNC_DB_SCHEMA = [{ name: 'events', indexes: ['value.sift.guid'] }, { name: 'admin' }];

    var MSG_DB_PREFIX = 'rs_msg_db';
    var MSG_DB_VERSIONED_SCHEMA = [
      // version 1
      [{ name: '_id.list', indexes: ['sift.guid'] }, { name: '_tid.list', indexes: ['sift.guid'] }],
      // version 2
      [{ name: EMAIL_ID_BUCKET, indexes: ['sift.guid'] }, { name: EMAIL_TID_BUCKET, indexes: ['sift.guid'] }, { name: '_id.list', drop: true }, { name: '_tid.list', drop: true }]
    ];

    // siftDb required buckets
    var USER_BUCKET = '_user.default';
    var REDSIFT_BUCKET = '_redsift';

    var RSStorage = function RSStorage(dbInfo, ll) {
      loglevel$1.setLevel(ll || 'warn');
      this._logger = loglevel$1;
      // dbInfo: {type: 'SYNC' | 'MSG' | 'SIFT', siftGuid: guid, accountGuid: guid, schema: schema }
      this._createDb(dbInfo);
    };

    /*****************************************************************
     * External Operations
     *****************************************************************/
    RSStorage.prototype.get = function get (params) {
        var this$1 = this;

      var db = this._db;
      this._logger.trace('[RSStorage::get]: ', params);
      if (!params.bucket) {
        return Promise.reject('[RSStorage::get]: params.bucket undefined');
      }
      if (!params.keys || params.keys.length === 0) {
        return Promise.reject('[RSStorage::get]: param.keys undefined');
      }
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        var keys = params.keys.map(function (k) {
          return this$1._siftGuid + '/' + k;
        });
        return this._findIn(db, params.bucket, keys).then(function (result) {
          return result.map(function (r) {
            return { key: r.key.split('/')[1], value: r.value };
          });
        });
      }
      return this._findIn(db, params.bucket, params.keys);
    };

    RSStorage.prototype.getIndexKeys = function getIndexKeys (params) {
      var db = this._db;
      this._logger.trace('[RSStorage::getIndexKeys]: ', params);
      if (!params.bucket) {
        return Promise.reject('[RSStorage::getIndexKeys]: params.bucket undefined');
      }
      if (!params.index) {
        return Promise.reject('[RSStorage::getIndexKeys]: params.index undefined');
      }
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        return this._getAll(db, params.bucket, false, params.index, params.range).then(function (result) {
          return result.map(function (r) {
            return { key: r.key.split('/')[1], value: r.value };
          });
        });
      }
      return this._getAll(db, params.bucket, false, params.index, params.range);
    };

    RSStorage.prototype.getIndex = function getIndex (params) {
      var db = this._db;
      this._logger.trace('[RSStorage::getIndex]: ', params);
      if (!params.bucket) {
        return Promise.reject('[RSStorage::getIndex]:params.bucket undefined');
      }
      if (!params.index) {
        return Promise.reject('[RSStorage::getIndex]:params.index undefined');
      }
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        return this._getAll(db, params.bucket, true, params.index, params.range).then(function (result) {
          return result.map(function (r) {
            return { key: r.key.split('/')[1], value: r.value };
          });
        });
      }
      return this._getAll(db, params.bucket, true, params.index, params.range);
    };

    RSStorage.prototype.getWithIndex = function getWithIndex (params) {
        var this$1 = this;

      var db = this._db;
      this._logger.trace('[RSStorage::getWithIndex]: ', params);
      if (!params.bucket) {
        return Promise.reject('[RSStorage::getWithIndex]:params.bucket undefined');
      }
      if (!params.keys) {
        return Promise.reject('[RSStorage::getWithIndex]:params.keys undefined');
      }
      if (!params.index) {
        return Promise.reject('[RSStorage::getWithIndex]:params.index undefined');
      }
      if (!params.range) {
        return Promise.reject('[RSStorage::getWithIndex]:params.range undefined');
      }
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        var keys = params.keys.map(function (k) {
          return this$1._siftGuid + '/' + k;
        });
        return this._getWithIndexRange(db, params.bucket, keys, params.index, params.range).then(function (result) {
          return result.map(function (r) {
            return { key: r.key.split('/')[1], value: r.value };
          });
        });
      }
      return this._getWithIndexRange(db, params.bucket, params.keys, params.index, params.range);
    };

    RSStorage.prototype.getAllKeys = function getAllKeys (params) {
      var db = this._db;
      this._logger.trace('[RSStorage::getAllKeys]: ', params);
      if (!params.bucket) {
        return Promise.reject('[RSStorage::getAllKeys]: params.bucket undefined');
      }
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        return this._getAll(db, params.bucket, false, 'sift.guid', this._siftGuid)
          .then(function (result) { return result.map(function (r) { return r.key.split('/')[1]; }); } );
      }
      return this._getAll(db, params.bucket, false);
    };

    RSStorage.prototype.getAll = function getAll (params) {
      var db = this._db;
      this._logger.trace('[RSStorage::getAll]: ', params);
      if (!params.bucket) {
        return Promise.reject('[RSStorage::getAll]: params.bucket undefined');
      }
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        return this._getAll(db, params.bucket, true, 'sift.guid', this._siftGuid)
          .then(function (result) { return result.map(function (r) { return ({ key: r.key.split('/')[1], value: r.value }); }); }
          );
      }
      return this._getAll(db, params.bucket, true);
    };

    RSStorage.prototype.getUser = function getUser (params) {
      this._logger.trace('[RSStorage::getUser]: ', params);
      params.bucket = USER_BUCKET;
      return this.get(params);
    };

    RSStorage.prototype.putUser = function putUser (params) {
      params.bucket = USER_BUCKET;
      this._logger.trace('[RSStorage::putUser]: ', params);
      if (!params.kvs || params.kvs.length === 0) {
        return Promise.reject('[RSStorage::putUser]: params.kvs undefined');
      }
      return this._put(params);
    };;

    RSStorage.prototype.delUser = function delUser (params) {
      params.bucket = USER_BUCKET;
      this._logger.trace('[RSStorage::delUser]: ', params);
      return this._del(params);
    };;

    /*****************************************************************
     * Internal Operations
     *****************************************************************/
    RSStorage.prototype._createDb = function _createDb (dbInfo) {
      if (!dbInfo.accountGuid) {
        throw new Error('[RSStorage::_createDb]: dbInfo.accountGuid undefined');
      }
      this._accountGuid = dbInfo.accountGuid;
      switch (dbInfo.type) {
        case 'MSG':
          this._msgDb = treo(MSG_DB_PREFIX + '-' + dbInfo.accountGuid, this._getVersionedTreoSchema(MSG_DB_VERSIONED_SCHEMA));
          break;
        case 'SIFT':
          if (!dbInfo.siftGuid) {
            throw new Error('[RSStorage::_createDb]: dbInfo.siftGuid undefined');
          }
          else {
            this._siftGuid = dbInfo.siftGuid;
          }
          this._logger.trace('[RSStorage::_createDb]: creating SIFT db.');
          var schema = this._getTreoSchema(dbInfo.schema, true);
          schema = schema.addStore(USER_BUCKET).addStore(REDSIFT_BUCKET);
          this._db = treo(this._siftGuid + '-' + this._accountGuid, schema);
          this._msgDb = treo(MSG_DB_PREFIX + '-' + dbInfo.accountGuid, this._getVersionedTreoSchema(MSG_DB_VERSIONED_SCHEMA));
          break;
        case 'SYNC':
          this._logger.trace('[RSStorage::_createDb]: creating SYNC db.');
          this._db = treo(SYNC_DB_PREFIX + '-' + dbInfo.accountGuid, this._getTreoSchema(SYNC_DB_SCHEMA));
          break;
        default:
          throw new Error('[RSStorage::_createDb]: unsupported db type: ' + dbInfo.type);
      }
    };

    // define db schema
    RSStorage.prototype._getTreoSchema = function _getTreoSchema (stores, sift) {
      var schema = treo.schema().version(1);
      stores.forEach(function (os) {
        if (!(sift && (SPECIAL_BUCKETS.indexOf(os.name) !== -1))) {
          if (os.keypath) {
            schema = schema.addStore(os.name, { key: os.keypath });
          }
          else {
            schema = schema.addStore(os.name);
          }
          if (os.indexes) {
            os.indexes.forEach(function (idx) {
              schema = schema.addIndex(idx, idx, { unique: false });
            });
          }
        }
      });
      return schema;
    };

    RSStorage.prototype._getVersionedTreoSchema = function _getVersionedTreoSchema (versions, sift) {
        var this$1 = this;

      var schema = treo.schema();
      versions.forEach(function (stores, i) {
        schema = schema.version(i + 1);
        stores.forEach(function (os) {
          if (!(sift && (SPECIAL_BUCKETS.indexOf(os.name) !== -1))) {
            if (os.drop) {
              this$1._logger.trace('[RSStorage::_getVersionedTreoSchema]: dropping store: ', os.name);
              schema = schema.dropStore(os.name);
            }
            else if (os.keypath) {
              schema = schema.addStore(os.name, { key: os.keypath });
            }
            else {
              schema = schema.addStore(os.name);
            }
            if (os.indexes) {
              os.indexes.forEach(function (idx) {
                if (os.drop) {
                  this$1._logger.trace('[RSStorage::_getVersionedTreoSchema]: dropping store/index: ' + os.name + '/' + idx);
                  schema = schema.dropIndex(idx);
                }
                else {
                  schema = schema.addIndex(idx, idx, { unique: false });
                }
              });
            }
          }
        });
      });
      return schema;
    };

    RSStorage.prototype._del = function _del (params) {
        var this$1 = this;

      var db = this._db;
      if (!params.bucket) {
        return Promise.reject('[RSStorage::_del]: params.bucket undefined');
      }
      if (!params.keys || params.keys.length === 0) {
        this._logger.trace('[RSStorage::_del]: params.keys undefined');
        return Promise.resolve();
      }
      var keys = params.keys;
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        keys = params.keys.map(function (k) {
          return this$1._siftGuid + '/' + k;
        });
      }
      return this._batchDelete(db, params.bucket, keys);
    };

    RSStorage.prototype._put = function _put (params, raw) {
        var this$1 = this;

      this._logger.trace('[RSStorage::_put]: ', params, raw);
      var db = this._db;
      if (!params.bucket) {
        return Promise.reject('[RSStorage::_put]: params.bucket undefined');
      }
      if (!params.kvs || params.kvs.length === 0) {
        this._logger.warn('[RSStorage::_put]: params.kvs undefined');
        return Promise.resolve();
      }
      var kvs = params.kvs;
      if (!raw) {
        // Wrap value into a {value: object}
        kvs = kvs.map(function (kv) {
          return { key: kv.key, value: { value: kv.value } };
        });
      }
      if (params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
        db = this._msgDb;
        kvs = kvs.map(function (kv) {
          return { key: this$1._siftGuid + '/' + kv.key, value: kv.value };
        });
      }
      return this._batchPut(db, params.bucket, kvs);
    };

    RSStorage.prototype._deleteDatabase = function _deleteDatabase () {
        var this$1 = this;

      this._logger.trace('[RSStorage::_deleteDatabase]');
      return new Promise(function (resolve, reject) {
        this$1._db.drop(function (err) {
          if (!err) {
            resolve();
          }
          else {
            reject(err);
          }
        });
      });
    };

    RSStorage.prototype._cursor = function _cursor (params, done) {
      this._logger.trace('[RSStorage::_cursor]', params);
      if (!params.bucket) {
        throw new Error('[RSStorage::_cursor: params.bucket undefined');
      }
      else {
        var bucket = this._db.store(params.bucket);
        bucket.cursor({ iterator: params.iterator.bind(this) }, done.bind(this));
      }
    };;

    // Batch deletion supports numeric keys
    RSStorage.prototype._batchDelete = function _batchDelete (db, bucket, vals) {
      this._logger.trace('[RSStorage::_batchDelete]: ', bucket, vals);
      return new Promise(function (resolve, reject) {
        var keys = vals;
        db.transaction('readwrite', [bucket], function (err, tr) {
          if (err) { return reject(err); }
          var store = tr.objectStore(bucket);
          var current = 0;
          var next = function () {
            if (current >= keys.length) { return; }
            var currentKey = keys[current];
            var req;
            req = store.delete(currentKey);
            req.onerror = reject;
            req.onsuccess = next;
            current += 1;
          };
          tr.onerror = tr.onabort = reject;
          tr.oncomplete = function () { resolve(); };
          next();
        });
      });
    };

    RSStorage.prototype._batchPut = function _batchPut (db, bucket, kvs) {
        var this$1 = this;

      this._logger.trace('[RSStorage::_batchPut]: ', db, bucket, kvs);
      return new Promise(function (resolve, reject) {
        var count = kvs.length;
        db.transaction('readwrite', [bucket], function (err, tr) {
          if (err) { return reject(err); }
          var store = tr.objectStore(bucket);
          var current = 0;
          var next = function () {
            if (current >= count) { return; }
            this$1._logger.trace('[RSStorage::_batchPut: put: ', kvs[current]);
            var req;
            req = store.put(kvs[current].value, kvs[current].key);
            req.onerror = reject;
            req.onsuccess = next;
            current += 1;
          };
          tr.onerror = tr.onabort = reject;
          tr.oncomplete = function () { resolve(); };
          next();
        });
      });
    };

    RSStorage.prototype._getWithIndexRange = function _getWithIndexRange (db, bucket, keys, index, range) {
        var this$1 = this;

      this._logger.trace('[RSStorage::_getWithIndexRange]: ', bucket, keys, index, range);
      return new Promise(function (resolve, reject) {
        var store = db.store(bucket);
        var result = [];
        var found = 0;
        var iterator = function (cursor) {
          var ki = keys.indexOf(cursor.primaryKey);
          if (ki !== -1) {
            this$1._logger.trace('[RSStorage::found key: ', cursor.primaryKey);
            result[ki].value = cursor.value.value;
            found++;
          }
          if (found === keys.length) {
            return done();
          }
          cursor.continue();
        };
        var done = function (err) {
          this$1._logger.trace('[RSStorage::_getWithIndexRange: result: ', result);
          err ? reject(err) : resolve(result);
        };
        keys.forEach(function (k) {
          result.push({ key: k, value: undefined });
        });
        store.cursor({ index: index, range: range, iterator: iterator.bind(this$1) }, done.bind(this$1));
      });
    };

    RSStorage.prototype._findIn = function _findIn (db, bucket, keys) {
        var this$1 = this;

      this._logger.trace('[RSStorage::_findIn]: ', bucket, keys);
      return new Promise(function (resolve, reject) {
        var store = db.store(bucket);
        var result = [];
        var current = 0;
        var iterator = function (cursor) {
          this$1._logger.trace('[RSStorage::_findIn]: iterator: ', cursor);
          if (cursor.key > sKeys[current]) {
            this$1._logger.trace('[RSStorage::_findIn]: cursor ahead: ', cursor.key, sKeys[current]);
            while (cursor.key > sKeys[current] && current < sKeys.length) {
              current += 1;
              this$1._logger.trace('[RSStorage::_findIn]: moving to next key: ', cursor.key, sKeys[current]);
            }
            if (current > sKeys.length) {
              this$1._logger.trace('[RSStorage::_findIn]: exhausted keys. done.');
              return done();
            }
          }
          if (cursor.key === sKeys[current]) {
            this$1._logger.trace('[RSStorage::_findIn]: found key: ', cursor.key);
            result[keys.indexOf(sKeys[current])] = { key: cursor.key, value: cursor.value.value };
            current += 1;
            (current < sKeys.length) ? cursor.continue(sKeys[current]) : done();
          }
          else {
            this$1._logger.trace('[RSStorage::_findIn]: continuing to next key: ', sKeys[current]);
            cursor.continue(sKeys[current]); // go to next key
          }
        };
        var done = function (err) {
          this$1._logger.trace('[RSStorage::findIn]: result: ', result);
          err ? reject(err) : resolve(result);
        };
        var sKeys = keys.slice();
        sKeys = sKeys.sort(treo.cmp);
        this$1._logger.trace('[RSStorage::findIn: sorted keys: ', sKeys);
        keys.forEach(function (k) {
          result.push({ key: k, value: undefined });
        });
        store.cursor({ iterator: iterator.bind(this$1) }, done.bind(this$1));
      });
    };

    RSStorage.prototype._getAll = function _getAll (db, bucket, loadValue, index, range) {
        var this$1 = this;

      this._logger.trace('[RSStorage::_getAll]: ', bucket, loadValue, index, range);
      return new Promise(function (resolve, reject) {
        var result = [];
        var keys = [];
        var store = db.store(bucket);
        var iterator = function (cursor) {
          var kv = { key: cursor.primaryKey };
          if (loadValue) {
            kv.value = cursor.value.value;
          }
          if (index) {
            kv.index = cursor.key;
          }
          result.push(kv);
          keys.push(cursor.primaryKey);
          cursor.continue();
        };
        var opts = { iterator: iterator.bind(this$1) };
        if (index) {
          opts.index = index;
        }
        if (range) {
          opts.range = range;
        }
        store.cursor(opts, function (err) {
          if (err) {
            reject(err);
          }
          else {
            if (!index && !range && !loadValue) {
              resolve(keys);
            }
            else {
              resolve(result);
            }
          }
        });
      });
    };

    var SiftController = function SiftController() {
      this._proxy = self;
      this.storage = new SiftStorage();
      this.view = new Observable();
      this.emailclient = new EmailClient(self);
      this._registerMessageListeners();
    };

    SiftController.prototype.publish = function publish (topic, value) {
      this._proxy.postMessage({
        method: 'notifyView',
        params: {
          topic: topic,
          value: value
        }
      });
    };

    SiftController.prototype._registerMessageListeners = function _registerMessageListeners () {
        var this$1 = this;

      if(!this._proxy) return;
      this._proxy.onmessage = function (e) {
        // console.log('[SiftController::onmessage]: ', e.data);
        var method = e.data.method;
        if (this$1['_' + method]) {
          this$1['_' + method](e.data.params);
        }
        else {
          // console.log('[SiftController:onmessage]: method not implemented: ', method);
        }
      };
    };

    SiftController.prototype._init = function _init (params) {
      // console.log('[SiftController::_init]: ', params);
      this.storage.init(
        new RSStorage({
          type: 'SIFT',
          siftGuid: params.siftGuid,
          accountGuid: params.accountGuid,
          schema: params.dbSchema
        },
          false)
      );
      // Initialise sift details
      this._guid = params.siftGuid;
      this._account = params.accountGuid;
      // Init is done, post a message to the iframe_controller
      this._proxy.postMessage({
        method: 'initCallback',
        result: params
      });
    };

    SiftController.prototype._terminate = function _terminate () {
      if(!this._proxy) return;
      // console.log('[SiftController::_terminate]');
      this._proxy.close();
    };

    SiftController.prototype._postCallback = function _postCallback (params, _result) {
      this._proxy.postMessage({
        method: 'loadViewCallback',
        params: {
          user: { guid: this._account },
          sift: { guid: this._guid },
          type: params.type,
          sizeClass: params.sizeClass,
          result: _result
        }
      });
    };

    SiftController.prototype._loadView = function _loadView (params) {
        var this$1 = this;

      // console.log('[SiftController::_loadView]: ', params);
      if (!this.loadView) {
        console.error('[SiftController::_loadView]: Sift controller must implement the loadView method');
        return;
      }
      // Invoke loadView method
      var result = this.loadView({
        sizeClass: params.sizeClass,
        type: params.type,
        params: params.data
      });
      // console.log('[SiftController::_loadView] loadView result: ', result);
      if (result.data && 'function' === typeof result.data.then) {
        if (result.html) {
          this._postCallback(params, { html: result.html });
        }
        result.data.then(function (data) {
          this$1._postCallback(params, { html: result.html, data: data });
        }).catch(function (error) {
          console.error('[SiftController::loadView]: promise rejected: ', error);
        });
      }
      else {
        this._postCallback(params, result);
      }
    };

    SiftController.prototype._storageUpdated = function _storageUpdated (params) {
        var this$1 = this;

      // console.log('[SiftController::_storageUpdated]: ', params);
      // Notify the * listeners
      this.storage.publish('*', params);
      params.forEach(function (b) {
        // Notify the bucket listeners.
        // TODO: send the list of keys instead of "[b]"
        this$1.storage.publish(b, [b]);
      });
    };

    SiftController.prototype._notifyController = function _notifyController (params) {
      // console.log('[SiftController::_notifyController]: ', params);
      this.view.publish(params.topic, params.value);
    };

    SiftController.prototype._emailComposer = function _emailComposer (params) {
      // console.log('[SiftController::_emailComposer]: ', params);
      this.emailclient.publish(params.topic, params.value);
    };

    function registerSiftController(siftController) {
      console.log('[Redsift::registerSiftController]: registered');
    }

    var PixelTrackerController = (function (SiftController) {
      function PixelTrackerController() {
        // You have to call the super() method to initialize the base class.
        SiftController.call(this);

        this._summaryView = false;


        // // This is how you subscribe to the storage  (to use class variables and functions don't
        // // forget to bind the 'this' pointer!):
        // this.storage.subscribe(['year', 'month', 'day'], this.onStorageUpdate.bind(this));
        // // Subscribe to your custom events from the Sift view like so (to use class variables and functions don't
        // // forget to bind the 'this' pointer!):
        // this.view.subscribe('currency', this.onCurrencyChange.bind(this));
        this.storage.subscribe('_email.tid', this.threadUpdates.bind(this))
      }

      if ( SiftController ) PixelTrackerController.__proto__ = SiftController;
      PixelTrackerController.prototype = Object.create( SiftController && SiftController.prototype );
      PixelTrackerController.prototype.constructor = PixelTrackerController;

      // Function: loadView
      // Description: Invoked when a Sift has transitioned to a final size class or when its storage has been updated
      // Parameters:
      // @value: {
      //          sizeClass: {
      //            previous: {width: 'small'|'medium'|'full', height: 'medium'|'full'},
      //            current:  {width: 'small'|'medium'|'full', height: 'medium'|'full'}
      //          },
      //          type: 'email-compose'|'email-detail'|'summary',
      //          params: {<object>}
      //        }
      // return: null or {html:'<string>', data: {<object>}}
      // @resolve: function ({html:'<string>', data: {<object>})
      // @reject: function (error)
      PixelTrackerController.prototype.threadUpdates = function threadUpdates (value){
        var this$1 = this;

        if (!this._summaryView) return;

        console.log('sift-pixel-tracker: storage updated: ', value);
        this._getAllValues().then(function (graph) { return this$1.publish('graph', graph); } );
      };

      PixelTrackerController.prototype.loadView = function loadView (state) {
        console.log('sift-pixel-tracker: loadView', state);
        var result = {
          html: 'view.html'
        };

        if (!state.params || Object.keys(state.params).length === 0) {
          if (state.type === 'summary') {
            // return async
            this._summaryView = true;
            result.data = this._getAllValues().then(function (g) { return ({ graph: g }); })
          } else {
            result.data = {
              graph: {
                'name': 'no-trackers-found',
                'children': []
              }
            };
          }
        } else {
          var graph = {
            name: 'Trackers',
            children: []
          };
          var trackers = state.params.detail.trackers;

          Object.keys(trackers).forEach(function (tracker) {
            if (typeof trackers[tracker] === 'number') {
              graph.children.push({
                name: tracker,
                count: trackers[tracker]
              });
            } else {
              graph.children.push({
                name: tracker,
                count: trackers[tracker].count,
                url: trackers[tracker].url });
            }
          });

          result.data = { graph: graph };
        }

        console.log('result sync=', result);
        // Synchronous return
        return result;
      };

      PixelTrackerController.prototype._getAllValues = function _getAllValues () {
        return this.storage.getAll({ bucket: '_email.tid' })
          .then(function (results) {
            // console.log('allValues=', results);
            var graph = {
              name: 'Trackers',
              children: []
            }
            var trackers = {};
            results.forEach(function (result) {
              try {
                var obj = JSON.parse(result.value);
                Object.keys(obj.detail.trackers).forEach(function (tracker) {
                  var name = obj.detail.trackers[tracker].name.toLowerCase();
                  //console.log('tracker=', tracker);
                  //console.log('tracker name=', name);
                  var trackerHash = trackers[name];
                  if (!trackerHash) {
                    trackerHash = { count: 0 };
                    trackers[name] = trackerHash;
                  }
                  // console.log('obj.detail.trackers[tracker]', obj.detail.trackers[tracker]);
                  if (typeof obj.detail.trackers[tracker] === 'number') {
                    trackerHash.count += obj.detail.trackers[tracker];
                  } else {
                    if (obj.detail.trackers[tracker].count) {
                      trackerHash.count += obj.detail.trackers[tracker].count;
                    }
                    if (obj.detail.trackers[tracker].name) {
                      trackerHash.name = obj.detail.trackers[tracker].name;
                    }
                    if (obj.detail.trackers[tracker].id) {
                      trackerHash.id = obj.detail.trackers[tracker].id;
                    }
                  }
                });
              } catch (err) {
                console.error('getAllValues err', err);
              }
            });

            Object.keys(trackers).forEach(function (tracker) {
              //console.log('graphing:', tracker, trackers[tracker]);
              graph.children.push({
                id: trackers[tracker].id,
                count: trackers[tracker].count,
                name: trackers[tracker].name
              });
            });

            // console.log('graph async=', graph);
            return graph
          }).catch(function (err) {
            console.log('Got error', err);
          });
      };

      return PixelTrackerController;
    }(SiftController));

    // FIXXME: how can we automate the registration without developer interaction
    registerSiftController(new PixelTrackerController());

    return PixelTrackerController;

}));