(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
   typeof define === 'function' && define.amd ? define(factory) :
   (global.SiftPixelTracker = factory());
}(this, function () { 'use strict';

   var xhtml = "http://www.w3.org/1999/xhtml";

   var namespaces = {
     svg: "http://www.w3.org/2000/svg",
     xhtml: xhtml,
     xlink: "http://www.w3.org/1999/xlink",
     xml: "http://www.w3.org/XML/1998/namespace",
     xmlns: "http://www.w3.org/2000/xmlns/"
   };

   function namespace(name) {
     var prefix = name += "", i = prefix.indexOf(":");
     if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
     return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
   }

   function creatorInherit(name) {
     return function() {
       var document = this.ownerDocument,
           uri = this.namespaceURI;
       return uri === xhtml && document.documentElement.namespaceURI === xhtml
           ? document.createElement(name)
           : document.createElementNS(uri, name);
     };
   }

   function creatorFixed(fullname) {
     return function() {
       return this.ownerDocument.createElementNS(fullname.space, fullname.local);
     };
   }

   function creator(name) {
     var fullname = namespace(name);
     return (fullname.local
         ? creatorFixed
         : creatorInherit)(fullname);
   }

   var matcher = function(selector) {
     return function() {
       return this.matches(selector);
     };
   };

   if (typeof document !== "undefined") {
     var element = document.documentElement;
     if (!element.matches) {
       var vendorMatches = element.webkitMatchesSelector
           || element.msMatchesSelector
           || element.mozMatchesSelector
           || element.oMatchesSelector;
       matcher = function(selector) {
         return function() {
           return vendorMatches.call(this, selector);
         };
       };
     }
   }

   var matcher$1 = matcher;

   var filterEvents = {};

   var event = null;

   if (typeof document !== "undefined") {
     var element$1 = document.documentElement;
     if (!("onmouseenter" in element$1)) {
       filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
     }
   }

   function filterContextListener(listener, index, group) {
     listener = contextListener(listener, index, group);
     return function(event) {
       var related = event.relatedTarget;
       if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
         listener.call(this, event);
       }
     };
   }

   function contextListener(listener, index, group) {
     return function(event1) {
       var event0 = event; // Events can be reentrant (e.g., focus).
       event = event1;
       try {
         listener.call(this, this.__data__, index, group);
       } finally {
         event = event0;
       }
     };
   }

   function parseTypenames(typenames) {
     return typenames.trim().split(/^|\s+/).map(function(t) {
       var name = "", i = t.indexOf(".");
       if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
       return {type: t, name: name};
     });
   }

   function onRemove(typename) {
     return function() {
       var this$1 = this;

       var on = this.__on;
       if (!on) return;
       for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
         if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
           this$1.removeEventListener(o.type, o.listener, o.capture);
         } else {
           on[++i] = o;
         }
       }
       if (++i) on.length = i;
       else delete this.__on;
     };
   }

   function onAdd(typename, value, capture) {
     var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
     return function(d, i, group) {
       var this$1 = this;

       var on = this.__on, o, listener = wrap(value, i, group);
       if (on) for (var j = 0, m = on.length; j < m; ++j) {
         if ((o = on[j]).type === typename.type && o.name === typename.name) {
           this$1.removeEventListener(o.type, o.listener, o.capture);
           this$1.addEventListener(o.type, o.listener = listener, o.capture = capture);
           o.value = value;
           return;
         }
       }
       this.addEventListener(typename.type, listener, capture);
       o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
       if (!on) this.__on = [o];
       else on.push(o);
     };
   }

   function selection_on(typename, value, capture) {
     var this$1 = this;

     var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

     if (arguments.length < 2) {
       var on = this.node().__on;
       if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
         for (i = 0, o = on[j]; i < n; ++i) {
           if ((t = typenames[i]).type === o.type && t.name === o.name) {
             return o.value;
           }
         }
       }
       return;
     }

     on = value ? onAdd : onRemove;
     if (capture == null) capture = false;
     for (i = 0; i < n; ++i) this$1.each(on(typenames[i], value, capture));
     return this;
   }

   function none() {}

   function selector(selector) {
     return selector == null ? none : function() {
       return this.querySelector(selector);
     };
   }

   function selection_select(select) {
     if (typeof select !== "function") select = selector(select);

     for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
         if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
           if ("__data__" in node) subnode.__data__ = node.__data__;
           subgroup[i] = subnode;
         }
       }
     }

     return new Selection(subgroups, this._parents);
   }

   function empty() {
     return [];
   }

   function selectorAll(selector) {
     return selector == null ? empty : function() {
       return this.querySelectorAll(selector);
     };
   }

   function selection_selectAll(select) {
     if (typeof select !== "function") select = selectorAll(select);

     for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
         if (node = group[i]) {
           subgroups.push(select.call(node, node.__data__, i, group));
           parents.push(node);
         }
       }
     }

     return new Selection(subgroups, parents);
   }

   function selection_filter(match) {
     if (typeof match !== "function") match = matcher$1(match);

     for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
         if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
           subgroup.push(node);
         }
       }
     }

     return new Selection(subgroups, this._parents);
   }

   function sparse(update) {
     return new Array(update.length);
   }

   function selection_enter() {
     return new Selection(this._enter || this._groups.map(sparse), this._parents);
   }

   function EnterNode(parent, datum) {
     this.ownerDocument = parent.ownerDocument;
     this.namespaceURI = parent.namespaceURI;
     this._next = null;
     this._parent = parent;
     this.__data__ = datum;
   }

   EnterNode.prototype = {
     constructor: EnterNode,
     appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
     insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
     querySelector: function(selector) { return this._parent.querySelector(selector); },
     querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
   };

   function constant(x) {
     return function() {
       return x;
     };
   }

   var keyPrefix = "$"; // Protect against keys like “__proto__”.

   function bindIndex(parent, group, enter, update, exit, data) {
     var i = 0,
         node,
         groupLength = group.length,
         dataLength = data.length;

     // Put any non-null nodes that fit into update.
     // Put any null nodes into enter.
     // Put any remaining data into enter.
     for (; i < dataLength; ++i) {
       if (node = group[i]) {
         node.__data__ = data[i];
         update[i] = node;
       } else {
         enter[i] = new EnterNode(parent, data[i]);
       }
     }

     // Put any non-null nodes that don’t fit into exit.
     for (; i < groupLength; ++i) {
       if (node = group[i]) {
         exit[i] = node;
       }
     }
   }

   function bindKey(parent, group, enter, update, exit, data, key) {
     var i,
         node,
         nodeByKeyValue = {},
         groupLength = group.length,
         dataLength = data.length,
         keyValues = new Array(groupLength),
         keyValue;

     // Compute the key for each node.
     // If multiple nodes have the same key, the duplicates are added to exit.
     for (i = 0; i < groupLength; ++i) {
       if (node = group[i]) {
         keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
         if (keyValue in nodeByKeyValue) {
           exit[i] = node;
         } else {
           nodeByKeyValue[keyValue] = node;
         }
       }
     }

     // Compute the key for each datum.
     // If there a node associated with this key, join and add it to update.
     // If there is not (or the key is a duplicate), add it to enter.
     for (i = 0; i < dataLength; ++i) {
       keyValue = keyPrefix + key.call(parent, data[i], i, data);
       if (node = nodeByKeyValue[keyValue]) {
         update[i] = node;
         node.__data__ = data[i];
         nodeByKeyValue[keyValue] = null;
       } else {
         enter[i] = new EnterNode(parent, data[i]);
       }
     }

     // Add any remaining nodes that were not bound to data to exit.
     for (i = 0; i < groupLength; ++i) {
       if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
         exit[i] = node;
       }
     }
   }

   function selection_data(value, key) {
     if (!value) {
       data = new Array(this.size()), j = -1;
       this.each(function(d) { data[++j] = d; });
       return data;
     }

     var bind = key ? bindKey : bindIndex,
         parents = this._parents,
         groups = this._groups;

     if (typeof value !== "function") value = constant(value);

     for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
       var parent = parents[j],
           group = groups[j],
           groupLength = group.length,
           data = value.call(parent, parent && parent.__data__, j, parents),
           dataLength = data.length,
           enterGroup = enter[j] = new Array(dataLength),
           updateGroup = update[j] = new Array(dataLength),
           exitGroup = exit[j] = new Array(groupLength);

       bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

       // Now connect the enter nodes to their following update node, such that
       // appendChild can insert the materialized enter node before this node,
       // rather than at the end of the parent node.
       for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
         if (previous = enterGroup[i0]) {
           if (i0 >= i1) i1 = i0 + 1;
           while (!(next = updateGroup[i1]) && ++i1 < dataLength);
           previous._next = next || null;
         }
       }
     }

     update = new Selection(update, parents);
     update._enter = enter;
     update._exit = exit;
     return update;
   }

   function selection_exit() {
     return new Selection(this._exit || this._groups.map(sparse), this._parents);
   }

   function selection_merge(selection) {

     for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
       for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
         if (node = group0[i] || group1[i]) {
           merge[i] = node;
         }
       }
     }

     for (; j < m0; ++j) {
       merges[j] = groups0[j];
     }

     return new Selection(merges, this._parents);
   }

   function selection_order() {

     for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
       for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
         if (node = group[i]) {
           if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
           next = node;
         }
       }
     }

     return this;
   }

   function selection_sort(compare) {
     if (!compare) compare = ascending;

     function compareNode(a, b) {
       return a && b ? compare(a.__data__, b.__data__) : !a - !b;
     }

     for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
         if (node = group[i]) {
           sortgroup[i] = node;
         }
       }
       sortgroup.sort(compareNode);
     }

     return new Selection(sortgroups, this._parents).order();
   }

   function ascending(a, b) {
     return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
   }

   function selection_call() {
     var callback = arguments[0];
     arguments[0] = this;
     callback.apply(null, arguments);
     return this;
   }

   function selection_nodes() {
     var nodes = new Array(this.size()), i = -1;
     this.each(function() { nodes[++i] = this; });
     return nodes;
   }

   function selection_node() {

     for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
       for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
         var node = group[i];
         if (node) return node;
       }
     }

     return null;
   }

   function selection_size() {
     var size = 0;
     this.each(function() { ++size; });
     return size;
   }

   function selection_empty() {
     return !this.node();
   }

   function selection_each(callback) {

     for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
       for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
         if (node = group[i]) callback.call(node, node.__data__, i, group);
       }
     }

     return this;
   }

   function attrRemove(name) {
     return function() {
       this.removeAttribute(name);
     };
   }

   function attrRemoveNS(fullname) {
     return function() {
       this.removeAttributeNS(fullname.space, fullname.local);
     };
   }

   function attrConstant(name, value) {
     return function() {
       this.setAttribute(name, value);
     };
   }

   function attrConstantNS(fullname, value) {
     return function() {
       this.setAttributeNS(fullname.space, fullname.local, value);
     };
   }

   function attrFunction(name, value) {
     return function() {
       var v = value.apply(this, arguments);
       if (v == null) this.removeAttribute(name);
       else this.setAttribute(name, v);
     };
   }

   function attrFunctionNS(fullname, value) {
     return function() {
       var v = value.apply(this, arguments);
       if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
       else this.setAttributeNS(fullname.space, fullname.local, v);
     };
   }

   function selection_attr(name, value) {
     var fullname = namespace(name);

     if (arguments.length < 2) {
       var node = this.node();
       return fullname.local
           ? node.getAttributeNS(fullname.space, fullname.local)
           : node.getAttribute(fullname);
     }

     return this.each((value == null
         ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
         ? (fullname.local ? attrFunctionNS : attrFunction)
         : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
   }

   function window$1(node) {
     return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
         || (node.document && node) // node is a Window
         || node.defaultView; // node is a Document
   }

   function styleRemove(name) {
     return function() {
       this.style.removeProperty(name);
     };
   }

   function styleConstant(name, value, priority) {
     return function() {
       this.style.setProperty(name, value, priority);
     };
   }

   function styleFunction(name, value, priority) {
     return function() {
       var v = value.apply(this, arguments);
       if (v == null) this.style.removeProperty(name);
       else this.style.setProperty(name, v, priority);
     };
   }

   function selection_style(name, value, priority) {
     var node;
     return arguments.length > 1
         ? this.each((value == null
               ? styleRemove : typeof value === "function"
               ? styleFunction
               : styleConstant)(name, value, priority == null ? "" : priority))
         : window$1(node = this.node())
             .getComputedStyle(node, null)
             .getPropertyValue(name);
   }

   function propertyRemove(name) {
     return function() {
       delete this[name];
     };
   }

   function propertyConstant(name, value) {
     return function() {
       this[name] = value;
     };
   }

   function propertyFunction(name, value) {
     return function() {
       var v = value.apply(this, arguments);
       if (v == null) delete this[name];
       else this[name] = v;
     };
   }

   function selection_property(name, value) {
     return arguments.length > 1
         ? this.each((value == null
             ? propertyRemove : typeof value === "function"
             ? propertyFunction
             : propertyConstant)(name, value))
         : this.node()[name];
   }

   function classArray(string) {
     return string.trim().split(/^|\s+/);
   }

   function classList(node) {
     return node.classList || new ClassList(node);
   }

   function ClassList(node) {
     this._node = node;
     this._names = classArray(node.getAttribute("class") || "");
   }

   ClassList.prototype = {
     add: function(name) {
       var i = this._names.indexOf(name);
       if (i < 0) {
         this._names.push(name);
         this._node.setAttribute("class", this._names.join(" "));
       }
     },
     remove: function(name) {
       var i = this._names.indexOf(name);
       if (i >= 0) {
         this._names.splice(i, 1);
         this._node.setAttribute("class", this._names.join(" "));
       }
     },
     contains: function(name) {
       return this._names.indexOf(name) >= 0;
     }
   };

   function classedAdd(node, names) {
     var list = classList(node), i = -1, n = names.length;
     while (++i < n) list.add(names[i]);
   }

   function classedRemove(node, names) {
     var list = classList(node), i = -1, n = names.length;
     while (++i < n) list.remove(names[i]);
   }

   function classedTrue(names) {
     return function() {
       classedAdd(this, names);
     };
   }

   function classedFalse(names) {
     return function() {
       classedRemove(this, names);
     };
   }

   function classedFunction(names, value) {
     return function() {
       (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
     };
   }

   function selection_classed(name, value) {
     var names = classArray(name + "");

     if (arguments.length < 2) {
       var list = classList(this.node()), i = -1, n = names.length;
       while (++i < n) if (!list.contains(names[i])) return false;
       return true;
     }

     return this.each((typeof value === "function"
         ? classedFunction : value
         ? classedTrue
         : classedFalse)(names, value));
   }

   function textRemove() {
     this.textContent = "";
   }

   function textConstant(value) {
     return function() {
       this.textContent = value;
     };
   }

   function textFunction(value) {
     return function() {
       var v = value.apply(this, arguments);
       this.textContent = v == null ? "" : v;
     };
   }

   function selection_text(value) {
     return arguments.length
         ? this.each(value == null
             ? textRemove : (typeof value === "function"
             ? textFunction
             : textConstant)(value))
         : this.node().textContent;
   }

   function htmlRemove() {
     this.innerHTML = "";
   }

   function htmlConstant(value) {
     return function() {
       this.innerHTML = value;
     };
   }

   function htmlFunction(value) {
     return function() {
       var v = value.apply(this, arguments);
       this.innerHTML = v == null ? "" : v;
     };
   }

   function selection_html(value) {
     return arguments.length
         ? this.each(value == null
             ? htmlRemove : (typeof value === "function"
             ? htmlFunction
             : htmlConstant)(value))
         : this.node().innerHTML;
   }

   function raise() {
     if (this.nextSibling) this.parentNode.appendChild(this);
   }

   function selection_raise() {
     return this.each(raise);
   }

   function lower() {
     if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
   }

   function selection_lower() {
     return this.each(lower);
   }

   function selection_append(name) {
     var create = typeof name === "function" ? name : creator(name);
     return this.select(function() {
       return this.appendChild(create.apply(this, arguments));
     });
   }

   function constantNull() {
     return null;
   }

   function selection_insert(name, before) {
     var create = typeof name === "function" ? name : creator(name),
         select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
     return this.select(function() {
       return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
     });
   }

   function remove() {
     var parent = this.parentNode;
     if (parent) parent.removeChild(this);
   }

   function selection_remove() {
     return this.each(remove);
   }

   function selection_datum(value) {
     return arguments.length
         ? this.property("__data__", value)
         : this.node().__data__;
   }

   function dispatchEvent(node, type, params) {
     var window = window$1(node),
         event = window.CustomEvent;

     if (event) {
       event = new event(type, params);
     } else {
       event = window.document.createEvent("Event");
       if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
       else event.initEvent(type, false, false);
     }

     node.dispatchEvent(event);
   }

   function dispatchConstant(type, params) {
     return function() {
       return dispatchEvent(this, type, params);
     };
   }

   function dispatchFunction(type, params) {
     return function() {
       return dispatchEvent(this, type, params.apply(this, arguments));
     };
   }

   function selection_dispatch(type, params) {
     return this.each((typeof params === "function"
         ? dispatchFunction
         : dispatchConstant)(type, params));
   }

   var root = [null];

   function Selection(groups, parents) {
     this._groups = groups;
     this._parents = parents;
   }

   function selection() {
     return new Selection([[document.documentElement]], root);
   }

   Selection.prototype = selection.prototype = {
     constructor: Selection,
     select: selection_select,
     selectAll: selection_selectAll,
     filter: selection_filter,
     data: selection_data,
     enter: selection_enter,
     exit: selection_exit,
     merge: selection_merge,
     order: selection_order,
     sort: selection_sort,
     call: selection_call,
     nodes: selection_nodes,
     node: selection_node,
     size: selection_size,
     empty: selection_empty,
     each: selection_each,
     attr: selection_attr,
     style: selection_style,
     property: selection_property,
     classed: selection_classed,
     text: selection_text,
     html: selection_html,
     raise: selection_raise,
     lower: selection_lower,
     append: selection_append,
     insert: selection_insert,
     remove: selection_remove,
     datum: selection_datum,
     on: selection_on,
     dispatch: selection_dispatch
   };

   function select(selector) {
     return typeof selector === "string"
         ? new Selection([[document.querySelector(selector)]], [document.documentElement])
         : new Selection([[selector]], root);
   }

   var noop = {value: function() {}};

   function dispatch() {
     var arguments$1 = arguments;

     for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
       if (!(t = arguments$1[i] + "") || (t in _)) throw new Error("illegal type: " + t);
       _[t] = [];
     }
     return new Dispatch(_);
   }

   function Dispatch(_) {
     this._ = _;
   }

   function parseTypenames$1(typenames, types) {
     return typenames.trim().split(/^|\s+/).map(function(t) {
       var name = "", i = t.indexOf(".");
       if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
       if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
       return {type: t, name: name};
     });
   }

   Dispatch.prototype = dispatch.prototype = {
     constructor: Dispatch,
     on: function(typename, callback) {
       var _ = this._,
           T = parseTypenames$1(typename + "", _),
           t,
           i = -1,
           n = T.length;

       // If no callback was specified, return the callback of the given type and name.
       if (arguments.length < 2) {
         while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
         return;
       }

       // If a type was specified, set the callback for the given type and name.
       // Otherwise, if a null callback was specified, remove callbacks of the given name.
       if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
       while (++i < n) {
         if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
         else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
       }

       return this;
     },
     copy: function() {
       var copy = {}, _ = this._;
       for (var t in _) copy[t] = _[t].slice();
       return new Dispatch(copy);
     },
     call: function(type, that) {
       var arguments$1 = arguments;

       if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments$1[i + 2];
       if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
       for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
     },
     apply: function(type, that, args) {
       if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
       for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
     }
   };

   function get$1(type, name) {
     for (var i = 0, n = type.length, c; i < n; ++i) {
       if ((c = type[i]).name === name) {
         return c.value;
       }
     }
   }

   function set$1(type, name, callback) {
     for (var i = 0, n = type.length; i < n; ++i) {
       if (type[i].name === name) {
         type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
         break;
       }
     }
     if (callback != null) type.push({name: name, value: callback});
     return type;
   }

   var frame = 0;
   var timeout = 0;
   var interval = 0;
   var pokeDelay = 1000;
   var taskHead;
   var taskTail;
   var clockLast = 0;
   var clockNow = 0;
   var clockSkew = 0;
   var clock = typeof performance === "object" && performance.now ? performance : Date;
   var setFrame = typeof requestAnimationFrame === "function"
           ? (clock === Date ? function(f) { requestAnimationFrame(function() { f(clock.now()); }); } : requestAnimationFrame)
           : function(f) { setTimeout(f, 17); };
   function now() {
     return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
   }

   function clearNow() {
     clockNow = 0;
   }

   function Timer() {
     this._call =
     this._time =
     this._next = null;
   }

   Timer.prototype = timer.prototype = {
     constructor: Timer,
     restart: function(callback, delay, time) {
       if (typeof callback !== "function") throw new TypeError("callback is not a function");
       time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
       if (!this._next && taskTail !== this) {
         if (taskTail) taskTail._next = this;
         else taskHead = this;
         taskTail = this;
       }
       this._call = callback;
       this._time = time;
       sleep();
     },
     stop: function() {
       if (this._call) {
         this._call = null;
         this._time = Infinity;
         sleep();
       }
     }
   };

   function timer(callback, delay, time) {
     var t = new Timer;
     t.restart(callback, delay, time);
     return t;
   }

   function timerFlush() {
     now(); // Get the current time, if not already set.
     ++frame; // Pretend we’ve set an alarm, if we haven’t already.
     var t = taskHead, e;
     while (t) {
       if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
       t = t._next;
     }
     --frame;
   }

   function wake(time) {
     clockNow = (clockLast = time || clock.now()) + clockSkew;
     frame = timeout = 0;
     try {
       timerFlush();
     } finally {
       frame = 0;
       nap();
       clockNow = 0;
     }
   }

   function poke() {
     var now = clock.now(), delay = now - clockLast;
     if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
   }

   function nap() {
     var t0, t1 = taskHead, t2, time = Infinity;
     while (t1) {
       if (t1._call) {
         if (time > t1._time) time = t1._time;
         t0 = t1, t1 = t1._next;
       } else {
         t2 = t1._next, t1._next = null;
         t1 = t0 ? t0._next = t2 : taskHead = t2;
       }
     }
     taskTail = t0;
     sleep(time);
   }

   function sleep(time) {
     if (frame) return; // Soonest alarm already set, or will be.
     if (timeout) timeout = clearTimeout(timeout);
     var delay = time - clockNow;
     if (delay > 24) {
       if (time < Infinity) timeout = setTimeout(wake, delay);
       if (interval) interval = clearInterval(interval);
     } else {
       if (!interval) interval = setInterval(poke, pokeDelay);
       frame = 1, setFrame(wake);
     }
   }

   function timeout$1(callback, delay, time) {
     var t = new Timer;
     delay = delay == null ? 0 : +delay;
     t.restart(function(elapsed) {
       t.stop();
       callback(elapsed + delay);
     }, delay, time);
     return t;
   }

   var emptyOn = dispatch("start", "end", "interrupt");
   var emptyTween = [];

   var CREATED = 0;
   var SCHEDULED = 1;
   var STARTING = 2;
   var STARTED = 3;
   var ENDING = 4;
   var ENDED = 5;

   function schedule(node, name, id, index, group, timing) {
     var schedules = node.__transition;
     if (!schedules) node.__transition = {};
     else if (id in schedules) return;
     create(node, id, {
       name: name,
       index: index, // For context during callback.
       group: group, // For context during callback.
       on: emptyOn,
       tween: emptyTween,
       time: timing.time,
       delay: timing.delay,
       duration: timing.duration,
       ease: timing.ease,
       timer: null,
       state: CREATED
     });
   }

   function init(node, id) {
     var schedule = node.__transition;
     if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED) throw new Error("too late");
     return schedule;
   }

   function set(node, id) {
     var schedule = node.__transition;
     if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING) throw new Error("too late");
     return schedule;
   }

   function get(node, id) {
     var schedule = node.__transition;
     if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
     return schedule;
   }

   function create(node, id, self) {
     var schedules = node.__transition,
         tween;

     // Initialize the self timer when the transition is created.
     // Note the actual delay is not known until the first callback!
     schedules[id] = self;
     self.timer = timer(schedule, 0, self.time);

     // If the delay is greater than this first sleep, sleep some more;
     // otherwise, start immediately.
     function schedule(elapsed) {
       self.state = SCHEDULED;
       if (self.delay <= elapsed) start(elapsed - self.delay);
       else self.timer.restart(start, self.delay, self.time);
     }

     function start(elapsed) {
       var i, j, n, o;

       for (i in schedules) {
         o = schedules[i];
         if (o.name !== self.name) continue;

         // Interrupt the active transition, if any.
         // Dispatch the interrupt event.
         if (o.state === STARTED) {
           o.state = ENDED;
           o.timer.stop();
           o.on.call("interrupt", node, node.__data__, o.index, o.group);
           delete schedules[i];
         }

         // Cancel any pre-empted transitions. No interrupt event is dispatched
         // because the cancelled transitions never started. Note that this also
         // removes this transition from the pending list!
         else if (+i < id) {
           o.state = ENDED;
           o.timer.stop();
           delete schedules[i];
         }
       }

       // Defer the first tick to end of the current frame; see mbostock/d3#1576.
       // Note the transition may be canceled after start and before the first tick!
       // Note this must be scheduled before the start event; see d3/d3-transition#16!
       // Assuming this is successful, subsequent callbacks go straight to tick.
       timeout$1(function() {
         if (self.state === STARTED) {
           self.timer.restart(tick, self.delay, self.time);
           tick(elapsed);
         }
       });

       // Dispatch the start event.
       // Note this must be done before the tween are initialized.
       self.state = STARTING;
       self.on.call("start", node, node.__data__, self.index, self.group);
       if (self.state !== STARTING) return; // interrupted
       self.state = STARTED;

       // Initialize the tween, deleting null tween.
       tween = new Array(n = self.tween.length);
       for (i = 0, j = -1; i < n; ++i) {
         if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
           tween[++j] = o;
         }
       }
       tween.length = j + 1;
     }

     function tick(elapsed) {
       var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.state = ENDING, 1),
           i = -1,
           n = tween.length;

       while (++i < n) {
         tween[i].call(null, t);
       }

       // Dispatch the end event.
       if (self.state === ENDING) {
         self.state = ENDED;
         self.timer.stop();
         self.on.call("end", node, node.__data__, self.index, self.group);
         for (i in schedules) if (+i !== id) return void delete schedules[id];
         delete node.__transition;
       }
     }
   }

   function interrupt(node, name) {
     var schedules = node.__transition,
         schedule,
         active,
         empty = true,
         i;

     if (!schedules) return;

     name = name == null ? null : name + "";

     for (i in schedules) {
       if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
       active = schedule.state === STARTED;
       schedule.state = ENDED;
       schedule.timer.stop();
       if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
       delete schedules[i];
     }

     if (empty) delete node.__transition;
   }

   function selection_interrupt(name) {
     return this.each(function() {
       interrupt(this, name);
     });
   }

   function define$1(constructor, factory, prototype) {
     constructor.prototype = factory.prototype = prototype;
     prototype.constructor = constructor;
   }

   function extend(parent, definition) {
     var prototype = Object.create(parent.prototype);
     for (var key in definition) prototype[key] = definition[key];
     return prototype;
   }

   function Color() {}

   var darker = 0.7;
   var brighter = 1 / darker;

   var reHex3 = /^#([0-9a-f]{3})$/;
   var reHex6 = /^#([0-9a-f]{6})$/;
   var reRgbInteger = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;
   var reRgbPercent = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
   var reRgbaInteger = /^rgba\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
   var reRgbaPercent = /^rgba\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
   var reHslPercent = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
   var reHslaPercent = /^hsla\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
   var named = {
     aliceblue: 0xf0f8ff,
     antiquewhite: 0xfaebd7,
     aqua: 0x00ffff,
     aquamarine: 0x7fffd4,
     azure: 0xf0ffff,
     beige: 0xf5f5dc,
     bisque: 0xffe4c4,
     black: 0x000000,
     blanchedalmond: 0xffebcd,
     blue: 0x0000ff,
     blueviolet: 0x8a2be2,
     brown: 0xa52a2a,
     burlywood: 0xdeb887,
     cadetblue: 0x5f9ea0,
     chartreuse: 0x7fff00,
     chocolate: 0xd2691e,
     coral: 0xff7f50,
     cornflowerblue: 0x6495ed,
     cornsilk: 0xfff8dc,
     crimson: 0xdc143c,
     cyan: 0x00ffff,
     darkblue: 0x00008b,
     darkcyan: 0x008b8b,
     darkgoldenrod: 0xb8860b,
     darkgray: 0xa9a9a9,
     darkgreen: 0x006400,
     darkgrey: 0xa9a9a9,
     darkkhaki: 0xbdb76b,
     darkmagenta: 0x8b008b,
     darkolivegreen: 0x556b2f,
     darkorange: 0xff8c00,
     darkorchid: 0x9932cc,
     darkred: 0x8b0000,
     darksalmon: 0xe9967a,
     darkseagreen: 0x8fbc8f,
     darkslateblue: 0x483d8b,
     darkslategray: 0x2f4f4f,
     darkslategrey: 0x2f4f4f,
     darkturquoise: 0x00ced1,
     darkviolet: 0x9400d3,
     deeppink: 0xff1493,
     deepskyblue: 0x00bfff,
     dimgray: 0x696969,
     dimgrey: 0x696969,
     dodgerblue: 0x1e90ff,
     firebrick: 0xb22222,
     floralwhite: 0xfffaf0,
     forestgreen: 0x228b22,
     fuchsia: 0xff00ff,
     gainsboro: 0xdcdcdc,
     ghostwhite: 0xf8f8ff,
     gold: 0xffd700,
     goldenrod: 0xdaa520,
     gray: 0x808080,
     green: 0x008000,
     greenyellow: 0xadff2f,
     grey: 0x808080,
     honeydew: 0xf0fff0,
     hotpink: 0xff69b4,
     indianred: 0xcd5c5c,
     indigo: 0x4b0082,
     ivory: 0xfffff0,
     khaki: 0xf0e68c,
     lavender: 0xe6e6fa,
     lavenderblush: 0xfff0f5,
     lawngreen: 0x7cfc00,
     lemonchiffon: 0xfffacd,
     lightblue: 0xadd8e6,
     lightcoral: 0xf08080,
     lightcyan: 0xe0ffff,
     lightgoldenrodyellow: 0xfafad2,
     lightgray: 0xd3d3d3,
     lightgreen: 0x90ee90,
     lightgrey: 0xd3d3d3,
     lightpink: 0xffb6c1,
     lightsalmon: 0xffa07a,
     lightseagreen: 0x20b2aa,
     lightskyblue: 0x87cefa,
     lightslategray: 0x778899,
     lightslategrey: 0x778899,
     lightsteelblue: 0xb0c4de,
     lightyellow: 0xffffe0,
     lime: 0x00ff00,
     limegreen: 0x32cd32,
     linen: 0xfaf0e6,
     magenta: 0xff00ff,
     maroon: 0x800000,
     mediumaquamarine: 0x66cdaa,
     mediumblue: 0x0000cd,
     mediumorchid: 0xba55d3,
     mediumpurple: 0x9370db,
     mediumseagreen: 0x3cb371,
     mediumslateblue: 0x7b68ee,
     mediumspringgreen: 0x00fa9a,
     mediumturquoise: 0x48d1cc,
     mediumvioletred: 0xc71585,
     midnightblue: 0x191970,
     mintcream: 0xf5fffa,
     mistyrose: 0xffe4e1,
     moccasin: 0xffe4b5,
     navajowhite: 0xffdead,
     navy: 0x000080,
     oldlace: 0xfdf5e6,
     olive: 0x808000,
     olivedrab: 0x6b8e23,
     orange: 0xffa500,
     orangered: 0xff4500,
     orchid: 0xda70d6,
     palegoldenrod: 0xeee8aa,
     palegreen: 0x98fb98,
     paleturquoise: 0xafeeee,
     palevioletred: 0xdb7093,
     papayawhip: 0xffefd5,
     peachpuff: 0xffdab9,
     peru: 0xcd853f,
     pink: 0xffc0cb,
     plum: 0xdda0dd,
     powderblue: 0xb0e0e6,
     purple: 0x800080,
     rebeccapurple: 0x663399,
     red: 0xff0000,
     rosybrown: 0xbc8f8f,
     royalblue: 0x4169e1,
     saddlebrown: 0x8b4513,
     salmon: 0xfa8072,
     sandybrown: 0xf4a460,
     seagreen: 0x2e8b57,
     seashell: 0xfff5ee,
     sienna: 0xa0522d,
     silver: 0xc0c0c0,
     skyblue: 0x87ceeb,
     slateblue: 0x6a5acd,
     slategray: 0x708090,
     slategrey: 0x708090,
     snow: 0xfffafa,
     springgreen: 0x00ff7f,
     steelblue: 0x4682b4,
     tan: 0xd2b48c,
     teal: 0x008080,
     thistle: 0xd8bfd8,
     tomato: 0xff6347,
     turquoise: 0x40e0d0,
     violet: 0xee82ee,
     wheat: 0xf5deb3,
     white: 0xffffff,
     whitesmoke: 0xf5f5f5,
     yellow: 0xffff00,
     yellowgreen: 0x9acd32
   };

   define$1(Color, color, {
     displayable: function() {
       return this.rgb().displayable();
     },
     toString: function() {
       return this.rgb() + "";
     }
   });

   function color(format) {
     var m;
     format = (format + "").trim().toLowerCase();
     return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
         : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
         : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
         : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
         : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
         : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
         : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
         : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
         : named.hasOwnProperty(format) ? rgbn(named[format])
         : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
         : null;
   }

   function rgbn(n) {
     return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
   }

   function rgba(r, g, b, a) {
     if (a <= 0) r = g = b = NaN;
     return new Rgb(r, g, b, a);
   }

   function rgbConvert(o) {
     if (!(o instanceof Color)) o = color(o);
     if (!o) return new Rgb;
     o = o.rgb();
     return new Rgb(o.r, o.g, o.b, o.opacity);
   }

   function colorRgb(r, g, b, opacity) {
     return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
   }

   function Rgb(r, g, b, opacity) {
     this.r = +r;
     this.g = +g;
     this.b = +b;
     this.opacity = +opacity;
   }

   define$1(Rgb, colorRgb, extend(Color, {
     brighter: function(k) {
       k = k == null ? brighter : Math.pow(brighter, k);
       return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
     },
     darker: function(k) {
       k = k == null ? darker : Math.pow(darker, k);
       return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
     },
     rgb: function() {
       return this;
     },
     displayable: function() {
       return (0 <= this.r && this.r <= 255)
           && (0 <= this.g && this.g <= 255)
           && (0 <= this.b && this.b <= 255)
           && (0 <= this.opacity && this.opacity <= 1);
     },
     toString: function() {
       var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
       return (a === 1 ? "rgb(" : "rgba(")
           + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
           + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
           + Math.max(0, Math.min(255, Math.round(this.b) || 0))
           + (a === 1 ? ")" : ", " + a + ")");
     }
   }));

   function hsla(h, s, l, a) {
     if (a <= 0) h = s = l = NaN;
     else if (l <= 0 || l >= 1) h = s = NaN;
     else if (s <= 0) h = NaN;
     return new Hsl(h, s, l, a);
   }

   function hslConvert(o) {
     if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
     if (!(o instanceof Color)) o = color(o);
     if (!o) return new Hsl;
     if (o instanceof Hsl) return o;
     o = o.rgb();
     var r = o.r / 255,
         g = o.g / 255,
         b = o.b / 255,
         min = Math.min(r, g, b),
         max = Math.max(r, g, b),
         h = NaN,
         s = max - min,
         l = (max + min) / 2;
     if (s) {
       if (r === max) h = (g - b) / s + (g < b) * 6;
       else if (g === max) h = (b - r) / s + 2;
       else h = (r - g) / s + 4;
       s /= l < 0.5 ? max + min : 2 - max - min;
       h *= 60;
     } else {
       s = l > 0 && l < 1 ? 0 : h;
     }
     return new Hsl(h, s, l, o.opacity);
   }

   function colorHsl(h, s, l, opacity) {
     return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
   }

   function Hsl(h, s, l, opacity) {
     this.h = +h;
     this.s = +s;
     this.l = +l;
     this.opacity = +opacity;
   }

   define$1(Hsl, colorHsl, extend(Color, {
     brighter: function(k) {
       k = k == null ? brighter : Math.pow(brighter, k);
       return new Hsl(this.h, this.s, this.l * k, this.opacity);
     },
     darker: function(k) {
       k = k == null ? darker : Math.pow(darker, k);
       return new Hsl(this.h, this.s, this.l * k, this.opacity);
     },
     rgb: function() {
       var h = this.h % 360 + (this.h < 0) * 360,
           s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
           l = this.l,
           m2 = l + (l < 0.5 ? l : 1 - l) * s,
           m1 = 2 * l - m2;
       return new Rgb(
         hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
         hsl2rgb(h, m1, m2),
         hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
         this.opacity
       );
     },
     displayable: function() {
       return (0 <= this.s && this.s <= 1 || isNaN(this.s))
           && (0 <= this.l && this.l <= 1)
           && (0 <= this.opacity && this.opacity <= 1);
     }
   }));

   /* From FvD 13.37, CSS Color Module Level 3 */
   function hsl2rgb(h, m1, m2) {
     return (h < 60 ? m1 + (m2 - m1) * h / 60
         : h < 180 ? m2
         : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
         : m1) * 255;
   }

   var deg2rad = Math.PI / 180;
   var rad2deg = 180 / Math.PI;

   var Kn = 18;
   var Xn = 0.950470;
   var Yn = 1;
   var Zn = 1.088830;
   var t0 = 4 / 29;
   var t1 = 6 / 29;
   var t2 = 3 * t1 * t1;
   var t3 = t1 * t1 * t1;
   function labConvert(o) {
     if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
     if (o instanceof Hcl) {
       var h = o.h * deg2rad;
       return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
     }
     if (!(o instanceof Rgb)) o = rgbConvert(o);
     var b = rgb2xyz(o.r),
         a = rgb2xyz(o.g),
         l = rgb2xyz(o.b),
         x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
         y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
         z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
     return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
   }

   function lab(l, a, b, opacity) {
     return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
   }

   function Lab(l, a, b, opacity) {
     this.l = +l;
     this.a = +a;
     this.b = +b;
     this.opacity = +opacity;
   }

   define$1(Lab, lab, extend(Color, {
     brighter: function(k) {
       return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
     },
     darker: function(k) {
       return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
     },
     rgb: function() {
       var y = (this.l + 16) / 116,
           x = isNaN(this.a) ? y : y + this.a / 500,
           z = isNaN(this.b) ? y : y - this.b / 200;
       y = Yn * lab2xyz(y);
       x = Xn * lab2xyz(x);
       z = Zn * lab2xyz(z);
       return new Rgb(
         xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
         xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
         xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
         this.opacity
       );
     }
   }));

   function xyz2lab(t) {
     return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
   }

   function lab2xyz(t) {
     return t > t1 ? t * t * t : t2 * (t - t0);
   }

   function xyz2rgb(x) {
     return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
   }

   function rgb2xyz(x) {
     return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
   }

   function hclConvert(o) {
     if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
     if (!(o instanceof Lab)) o = labConvert(o);
     var h = Math.atan2(o.b, o.a) * rad2deg;
     return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
   }

   function colorHcl(h, c, l, opacity) {
     return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
   }

   function Hcl(h, c, l, opacity) {
     this.h = +h;
     this.c = +c;
     this.l = +l;
     this.opacity = +opacity;
   }

   define$1(Hcl, colorHcl, extend(Color, {
     brighter: function(k) {
       return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
     },
     darker: function(k) {
       return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
     },
     rgb: function() {
       return labConvert(this).rgb();
     }
   }));

   var A = -0.14861;
   var B = +1.78277;
   var C = -0.29227;
   var D = -0.90649;
   var E = +1.97294;
   var ED = E * D;
   var EB = E * B;
   var BC_DA = B * C - D * A;
   function cubehelixConvert(o) {
     if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
     if (!(o instanceof Rgb)) o = rgbConvert(o);
     var r = o.r / 255,
         g = o.g / 255,
         b = o.b / 255,
         l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
         bl = b - l,
         k = (E * (g - l) - C * bl) / D,
         s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
         h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
     return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
   }

   function cubehelix(h, s, l, opacity) {
     return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
   }

   function Cubehelix(h, s, l, opacity) {
     this.h = +h;
     this.s = +s;
     this.l = +l;
     this.opacity = +opacity;
   }

   define$1(Cubehelix, cubehelix, extend(Color, {
     brighter: function(k) {
       k = k == null ? brighter : Math.pow(brighter, k);
       return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
     },
     darker: function(k) {
       k = k == null ? darker : Math.pow(darker, k);
       return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
     },
     rgb: function() {
       var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
           l = +this.l,
           a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
           cosh = Math.cos(h),
           sinh = Math.sin(h);
       return new Rgb(
         255 * (l + a * (A * cosh + B * sinh)),
         255 * (l + a * (C * cosh + D * sinh)),
         255 * (l + a * (E * cosh)),
         this.opacity
       );
     }
   }));

   function constant$1(x) {
     return function() {
       return x;
     };
   }

   function linear(a, d) {
     return function(t) {
       return a + t * d;
     };
   }

   function exponential(a, b, y) {
     return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
       return Math.pow(a + t * b, y);
     };
   }

   function hue(a, b) {
     var d = b - a;
     return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$1(isNaN(a) ? b : a);
   }

   function gamma(y) {
     return (y = +y) === 1 ? nogamma : function(a, b) {
       return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
     };
   }

   function nogamma(a, b) {
     var d = b - a;
     return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
   }

   var interpolateRgb = (function rgbGamma(y) {
     var color = gamma(y);

     function rgb(start, end) {
       var r = color((start = colorRgb(start)).r, (end = colorRgb(end)).r),
           g = color(start.g, end.g),
           b = color(start.b, end.b),
           opacity = color(start.opacity, end.opacity);
       return function(t) {
         start.r = r(t);
         start.g = g(t);
         start.b = b(t);
         start.opacity = opacity(t);
         return start + "";
       };
     }

     rgb.gamma = rgbGamma;

     return rgb;
   })(1);

   function reinterpolate(a, b) {
     return a = +a, b -= a, function(t) {
       return a + b * t;
     };
   }

   var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
   var reB = new RegExp(reA.source, "g");
   function zero(b) {
     return function() {
       return b;
     };
   }

   function one(b) {
     return function(t) {
       return b(t) + "";
     };
   }

   function interpolateString(a, b) {
     var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
         am, // current match in a
         bm, // current match in b
         bs, // string preceding current number in b, if any
         i = -1, // index in s
         s = [], // string constants and placeholders
         q = []; // number interpolators

     // Coerce inputs to strings.
     a = a + "", b = b + "";

     // Interpolate pairs of numbers in a & b.
     while ((am = reA.exec(a))
         && (bm = reB.exec(b))) {
       if ((bs = bm.index) > bi) { // a string precedes the next number in b
         bs = b.slice(bi, bs);
         if (s[i]) s[i] += bs; // coalesce with previous string
         else s[++i] = bs;
       }
       if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
         if (s[i]) s[i] += bm; // coalesce with previous string
         else s[++i] = bm;
       } else { // interpolate non-matching numbers
         s[++i] = null;
         q.push({i: i, x: reinterpolate(am, bm)});
       }
       bi = reB.lastIndex;
     }

     // Add remains of b.
     if (bi < b.length) {
       bs = b.slice(bi);
       if (s[i]) s[i] += bs; // coalesce with previous string
       else s[++i] = bs;
     }

     // Special optimization for only a single match.
     // Otherwise, interpolate each of the numbers and rejoin the string.
     return s.length < 2 ? (q[0]
         ? one(q[0].x)
         : zero(b))
         : (b = q.length, function(t) {
             for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
             return s.join("");
           });
   }

   var degrees = 180 / Math.PI;

   var identity = {
     translateX: 0,
     translateY: 0,
     rotate: 0,
     skewX: 0,
     scaleX: 1,
     scaleY: 1
   };

   function decompose(a, b, c, d, e, f) {
     var scaleX, scaleY, skewX;
     if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
     if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
     if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
     if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
     return {
       translateX: e,
       translateY: f,
       rotate: Math.atan2(b, a) * degrees,
       skewX: Math.atan(skewX) * degrees,
       scaleX: scaleX,
       scaleY: scaleY
     };
   }

   var cssNode;
   var cssRoot;
   var cssView;
   var svgNode;
   function parseCss(value) {
     if (value === "none") return identity;
     if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
     cssNode.style.transform = value;
     value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
     cssRoot.removeChild(cssNode);
     value = value.slice(7, -1).split(",");
     return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
   }

   function parseSvg(value) {
     if (value == null) return identity;
     if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
     svgNode.setAttribute("transform", value);
     if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
     value = value.matrix;
     return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
   }

   function interpolateTransform(parse, pxComma, pxParen, degParen) {

     function pop(s) {
       return s.length ? s.pop() + " " : "";
     }

     function translate(xa, ya, xb, yb, s, q) {
       if (xa !== xb || ya !== yb) {
         var i = s.push("translate(", null, pxComma, null, pxParen);
         q.push({i: i - 4, x: reinterpolate(xa, xb)}, {i: i - 2, x: reinterpolate(ya, yb)});
       } else if (xb || yb) {
         s.push("translate(" + xb + pxComma + yb + pxParen);
       }
     }

     function rotate(a, b, s, q) {
       if (a !== b) {
         if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
         q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: reinterpolate(a, b)});
       } else if (b) {
         s.push(pop(s) + "rotate(" + b + degParen);
       }
     }

     function skewX(a, b, s, q) {
       if (a !== b) {
         q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: reinterpolate(a, b)});
       } else if (b) {
         s.push(pop(s) + "skewX(" + b + degParen);
       }
     }

     function scale(xa, ya, xb, yb, s, q) {
       if (xa !== xb || ya !== yb) {
         var i = s.push(pop(s) + "scale(", null, ",", null, ")");
         q.push({i: i - 4, x: reinterpolate(xa, xb)}, {i: i - 2, x: reinterpolate(ya, yb)});
       } else if (xb !== 1 || yb !== 1) {
         s.push(pop(s) + "scale(" + xb + "," + yb + ")");
       }
     }

     return function(a, b) {
       var s = [], // string constants and placeholders
           q = []; // number interpolators
       a = parse(a), b = parse(b);
       translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
       rotate(a.rotate, b.rotate, s, q);
       skewX(a.skewX, b.skewX, s, q);
       scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
       a = b = null; // gc
       return function(t) {
         var i = -1, n = q.length, o;
         while (++i < n) s[(o = q[i]).i] = o.x(t);
         return s.join("");
       };
     };
   }

   var interpolateTransform$1 = interpolateTransform(parseCss, "px, ", "px)", "deg)");
   var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

   function cubehelix$1(hue) {
     return (function cubehelixGamma(y) {
       y = +y;

       function cubehelix$$(start, end) {
         var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h),
             s = nogamma(start.s, end.s),
             l = nogamma(start.l, end.l),
             opacity = nogamma(start.opacity, end.opacity);
         return function(t) {
           start.h = h(t);
           start.s = s(t);
           start.l = l(Math.pow(t, y));
           start.opacity = opacity(t);
           return start + "";
         };
       }

       cubehelix$$.gamma = cubehelixGamma;

       return cubehelix$$;
     })(1);
   }

   cubehelix$1(hue);
   var interpolateCubehelixLong = cubehelix$1(nogamma);

   function tweenRemove(id, name) {
     var tween0, tween1;
     return function() {
       var schedule = set(this, id),
           tween = schedule.tween;

       // If this node shared tween with the previous node,
       // just assign the updated shared tween and we’re done!
       // Otherwise, copy-on-write.
       if (tween !== tween0) {
         tween1 = tween0 = tween;
         for (var i = 0, n = tween1.length; i < n; ++i) {
           if (tween1[i].name === name) {
             tween1 = tween1.slice();
             tween1.splice(i, 1);
             break;
           }
         }
       }

       schedule.tween = tween1;
     };
   }

   function tweenFunction(id, name, value) {
     var tween0, tween1;
     if (typeof value !== "function") throw new Error;
     return function() {
       var schedule = set(this, id),
           tween = schedule.tween;

       // If this node shared tween with the previous node,
       // just assign the updated shared tween and we’re done!
       // Otherwise, copy-on-write.
       if (tween !== tween0) {
         tween1 = (tween0 = tween).slice();
         for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
           if (tween1[i].name === name) {
             tween1[i] = t;
             break;
           }
         }
         if (i === n) tween1.push(t);
       }

       schedule.tween = tween1;
     };
   }

   function transition_tween(name, value) {
     var id = this._id;

     name += "";

     if (arguments.length < 2) {
       var tween = get(this.node(), id).tween;
       for (var i = 0, n = tween.length, t; i < n; ++i) {
         if ((t = tween[i]).name === name) {
           return t.value;
         }
       }
       return null;
     }

     return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
   }

   function tweenValue(transition, name, value) {
     var id = transition._id;

     transition.each(function() {
       var schedule = set(this, id);
       (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
     });

     return function(node) {
       return get(node, id).value[name];
     };
   }

   function interpolate(a, b) {
     var c;
     return (typeof b === "number" ? reinterpolate
         : b instanceof color ? interpolateRgb
         : (c = color(b)) ? (b = c, interpolateRgb)
         : interpolateString)(a, b);
   }

   function attrRemove$1(name) {
     return function() {
       this.removeAttribute(name);
     };
   }

   function attrRemoveNS$1(fullname) {
     return function() {
       this.removeAttributeNS(fullname.space, fullname.local);
     };
   }

   function attrConstant$1(name, interpolate, value1) {
     var value00,
         interpolate0;
     return function() {
       var value0 = this.getAttribute(name);
       return value0 === value1 ? null
           : value0 === value00 ? interpolate0
           : interpolate0 = interpolate(value00 = value0, value1);
     };
   }

   function attrConstantNS$1(fullname, interpolate, value1) {
     var value00,
         interpolate0;
     return function() {
       var value0 = this.getAttributeNS(fullname.space, fullname.local);
       return value0 === value1 ? null
           : value0 === value00 ? interpolate0
           : interpolate0 = interpolate(value00 = value0, value1);
     };
   }

   function attrFunction$1(name, interpolate, value) {
     var value00,
         value10,
         interpolate0;
     return function() {
       var value0, value1 = value(this);
       if (value1 == null) return void this.removeAttribute(name);
       value0 = this.getAttribute(name);
       return value0 === value1 ? null
           : value0 === value00 && value1 === value10 ? interpolate0
           : interpolate0 = interpolate(value00 = value0, value10 = value1);
     };
   }

   function attrFunctionNS$1(fullname, interpolate, value) {
     var value00,
         value10,
         interpolate0;
     return function() {
       var value0, value1 = value(this);
       if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
       value0 = this.getAttributeNS(fullname.space, fullname.local);
       return value0 === value1 ? null
           : value0 === value00 && value1 === value10 ? interpolate0
           : interpolate0 = interpolate(value00 = value0, value10 = value1);
     };
   }

   function transition_attr(name, value) {
     var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
     return this.attrTween(name, typeof value === "function"
         ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
         : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
         : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
   }

   function attrTweenNS(fullname, value) {
     function tween() {
       var node = this, i = value.apply(node, arguments);
       return i && function(t) {
         node.setAttributeNS(fullname.space, fullname.local, i(t));
       };
     }
     tween._value = value;
     return tween;
   }

   function attrTween(name, value) {
     function tween() {
       var node = this, i = value.apply(node, arguments);
       return i && function(t) {
         node.setAttribute(name, i(t));
       };
     }
     tween._value = value;
     return tween;
   }

   function transition_attrTween(name, value) {
     var key = "attr." + name;
     if (arguments.length < 2) return (key = this.tween(key)) && key._value;
     if (value == null) return this.tween(key, null);
     if (typeof value !== "function") throw new Error;
     var fullname = namespace(name);
     return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
   }

   function delayFunction(id, value) {
     return function() {
       init(this, id).delay = +value.apply(this, arguments);
     };
   }

   function delayConstant(id, value) {
     return value = +value, function() {
       init(this, id).delay = value;
     };
   }

   function transition_delay(value) {
     var id = this._id;

     return arguments.length
         ? this.each((typeof value === "function"
             ? delayFunction
             : delayConstant)(id, value))
         : get(this.node(), id).delay;
   }

   function durationFunction(id, value) {
     return function() {
       set(this, id).duration = +value.apply(this, arguments);
     };
   }

   function durationConstant(id, value) {
     return value = +value, function() {
       set(this, id).duration = value;
     };
   }

   function transition_duration(value) {
     var id = this._id;

     return arguments.length
         ? this.each((typeof value === "function"
             ? durationFunction
             : durationConstant)(id, value))
         : get(this.node(), id).duration;
   }

   function easeConstant(id, value) {
     if (typeof value !== "function") throw new Error;
     return function() {
       set(this, id).ease = value;
     };
   }

   function transition_ease(value) {
     var id = this._id;

     return arguments.length
         ? this.each(easeConstant(id, value))
         : get(this.node(), id).ease;
   }

   function transition_filter(match) {
     if (typeof match !== "function") match = matcher$1(match);

     for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
         if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
           subgroup.push(node);
         }
       }
     }

     return new Transition(subgroups, this._parents, this._name, this._id);
   }

   function transition_merge(transition) {
     if (transition._id !== this._id) throw new Error;

     for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
       for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
         if (node = group0[i] || group1[i]) {
           merge[i] = node;
         }
       }
     }

     for (; j < m0; ++j) {
       merges[j] = groups0[j];
     }

     return new Transition(merges, this._parents, this._name, this._id);
   }

   function start(name) {
     return (name + "").trim().split(/^|\s+/).every(function(t) {
       var i = t.indexOf(".");
       if (i >= 0) t = t.slice(0, i);
       return !t || t === "start";
     });
   }

   function onFunction(id, name, listener) {
     var on0, on1, sit = start(name) ? init : set;
     return function() {
       var schedule = sit(this, id),
           on = schedule.on;

       // If this node shared a dispatch with the previous node,
       // just assign the updated shared dispatch and we’re done!
       // Otherwise, copy-on-write.
       if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

       schedule.on = on1;
     };
   }

   function transition_on(name, listener) {
     var id = this._id;

     return arguments.length < 2
         ? get(this.node(), id).on.on(name)
         : this.each(onFunction(id, name, listener));
   }

   function removeFunction(id) {
     return function() {
       var parent = this.parentNode;
       for (var i in this.__transition) if (+i !== id) return;
       if (parent) parent.removeChild(this);
     };
   }

   function transition_remove() {
     return this.on("end.remove", removeFunction(this._id));
   }

   function transition_select(select) {
     var name = this._name,
         id = this._id;

     if (typeof select !== "function") select = selector(select);

     for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
         if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
           if ("__data__" in node) subnode.__data__ = node.__data__;
           subgroup[i] = subnode;
           schedule(subgroup[i], name, id, i, subgroup, get(node, id));
         }
       }
     }

     return new Transition(subgroups, this._parents, name, id);
   }

   function transition_selectAll(select) {
     var name = this._name,
         id = this._id;

     if (typeof select !== "function") select = selectorAll(select);

     for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
         if (node = group[i]) {
           for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
             if (child = children[k]) {
               schedule(child, name, id, k, children, inherit);
             }
           }
           subgroups.push(children);
           parents.push(node);
         }
       }
     }

     return new Transition(subgroups, parents, name, id);
   }

   var Selection$1 = selection.prototype.constructor;

   function transition_selection() {
     return new Selection$1(this._groups, this._parents);
   }

   function styleRemove$1(name, interpolate) {
     var value00,
         value10,
         interpolate0;
     return function() {
       var style = window$1(this).getComputedStyle(this, null),
           value0 = style.getPropertyValue(name),
           value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
       return value0 === value1 ? null
           : value0 === value00 && value1 === value10 ? interpolate0
           : interpolate0 = interpolate(value00 = value0, value10 = value1);
     };
   }

   function styleRemoveEnd(name) {
     return function() {
       this.style.removeProperty(name);
     };
   }

   function styleConstant$1(name, interpolate, value1) {
     var value00,
         interpolate0;
     return function() {
       var value0 = window$1(this).getComputedStyle(this, null).getPropertyValue(name);
       return value0 === value1 ? null
           : value0 === value00 ? interpolate0
           : interpolate0 = interpolate(value00 = value0, value1);
     };
   }

   function styleFunction$1(name, interpolate, value) {
     var value00,
         value10,
         interpolate0;
     return function() {
       var style = window$1(this).getComputedStyle(this, null),
           value0 = style.getPropertyValue(name),
           value1 = value(this);
       if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
       return value0 === value1 ? null
           : value0 === value00 && value1 === value10 ? interpolate0
           : interpolate0 = interpolate(value00 = value0, value10 = value1);
     };
   }

   function transition_style(name, value, priority) {
     var i = (name += "") === "transform" ? interpolateTransform$1 : interpolate;
     return value == null ? this
             .styleTween(name, styleRemove$1(name, i))
             .on("end.style." + name, styleRemoveEnd(name))
         : this.styleTween(name, typeof value === "function"
             ? styleFunction$1(name, i, tweenValue(this, "style." + name, value))
             : styleConstant$1(name, i, value), priority);
   }

   function styleTween(name, value, priority) {
     function tween() {
       var node = this, i = value.apply(node, arguments);
       return i && function(t) {
         node.style.setProperty(name, i(t), priority);
       };
     }
     tween._value = value;
     return tween;
   }

   function transition_styleTween(name, value, priority) {
     var key = "style." + (name += "");
     if (arguments.length < 2) return (key = this.tween(key)) && key._value;
     if (value == null) return this.tween(key, null);
     if (typeof value !== "function") throw new Error;
     return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
   }

   function textConstant$1(value) {
     return function() {
       this.textContent = value;
     };
   }

   function textFunction$1(value) {
     return function() {
       var value1 = value(this);
       this.textContent = value1 == null ? "" : value1;
     };
   }

   function transition_text(value) {
     return this.tween("text", typeof value === "function"
         ? textFunction$1(tweenValue(this, "text", value))
         : textConstant$1(value == null ? "" : value + ""));
   }

   function transition_transition() {
     var name = this._name,
         id0 = this._id,
         id1 = newId();

     for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
         if (node = group[i]) {
           var inherit = get(node, id0);
           schedule(node, name, id1, i, group, {
             time: inherit.time + inherit.delay + inherit.duration,
             delay: 0,
             duration: inherit.duration,
             ease: inherit.ease
           });
         }
       }
     }

     return new Transition(groups, this._parents, name, id1);
   }

   var id = 0;

   function Transition(groups, parents, name, id) {
     this._groups = groups;
     this._parents = parents;
     this._name = name;
     this._id = id;
   }

   function transition(name) {
     return selection().transition(name);
   }

   function newId() {
     return ++id;
   }

   var selection_prototype = selection.prototype;

   Transition.prototype = transition.prototype = {
     constructor: Transition,
     select: transition_select,
     selectAll: transition_selectAll,
     filter: transition_filter,
     merge: transition_merge,
     selection: transition_selection,
     transition: transition_transition,
     call: selection_prototype.call,
     nodes: selection_prototype.nodes,
     node: selection_prototype.node,
     size: selection_prototype.size,
     empty: selection_prototype.empty,
     each: selection_prototype.each,
     on: transition_on,
     attr: transition_attr,
     attrTween: transition_attrTween,
     style: transition_style,
     styleTween: transition_styleTween,
     text: transition_text,
     remove: transition_remove,
     tween: transition_tween,
     delay: transition_delay,
     duration: transition_duration,
     ease: transition_ease
   };

   function cubicInOut(t) {
     return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
   }

   var exponent = 3;

   var polyIn = (function custom(e) {
     e = +e;

     function polyIn(t) {
       return Math.pow(t, e);
     }

     polyIn.exponent = custom;

     return polyIn;
   })(exponent);

   var polyOut = (function custom(e) {
     e = +e;

     function polyOut(t) {
       return 1 - Math.pow(1 - t, e);
     }

     polyOut.exponent = custom;

     return polyOut;
   })(exponent);

   var polyInOut = (function custom(e) {
     e = +e;

     function polyInOut(t) {
       return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
     }

     polyInOut.exponent = custom;

     return polyInOut;
   })(exponent);

   var overshoot = 1.70158;

   var backIn = (function custom(s) {
     s = +s;

     function backIn(t) {
       return t * t * ((s + 1) * t - s);
     }

     backIn.overshoot = custom;

     return backIn;
   })(overshoot);

   var backOut = (function custom(s) {
     s = +s;

     function backOut(t) {
       return --t * t * ((s + 1) * t + s) + 1;
     }

     backOut.overshoot = custom;

     return backOut;
   })(overshoot);

   var backInOut = (function custom(s) {
     s = +s;

     function backInOut(t) {
       return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
     }

     backInOut.overshoot = custom;

     return backInOut;
   })(overshoot);

   var tau = 2 * Math.PI;
   var amplitude = 1;
   var period = 0.3;
   var elasticIn = (function custom(a, p) {
     var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

     function elasticIn(t) {
       return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
     }

     elasticIn.amplitude = function(a) { return custom(a, p * tau); };
     elasticIn.period = function(p) { return custom(a, p); };

     return elasticIn;
   })(amplitude, period);

   var elasticOut = (function custom(a, p) {
     var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

     function elasticOut(t) {
       return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
     }

     elasticOut.amplitude = function(a) { return custom(a, p * tau); };
     elasticOut.period = function(p) { return custom(a, p); };

     return elasticOut;
   })(amplitude, period);

   var elasticInOut = (function custom(a, p) {
     var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

     function elasticInOut(t) {
       return ((t = t * 2 - 1) < 0
           ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p)
           : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
     }

     elasticInOut.amplitude = function(a) { return custom(a, p * tau); };
     elasticInOut.period = function(p) { return custom(a, p); };

     return elasticInOut;
   })(amplitude, period);

   var defaultTiming = {
     time: null, // Set on use.
     delay: 0,
     duration: 250,
     ease: cubicInOut
   };

   function inherit(node, id) {
     var timing;
     while (!(timing = node.__transition) || !(timing = timing[id])) {
       if (!(node = node.parentNode)) {
         return defaultTiming.time = now(), defaultTiming;
       }
     }
     return timing;
   }

   function selection_transition(name) {
     var id,
         timing;

     if (name instanceof Transition) {
       id = name._id, name = name._name;
     } else {
       id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
     }

     for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
       for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
         if (node = group[i]) {
           schedule(node, name, id, i, group, timing || inherit(node, id));
         }
       }
     }

     return new Transition(groups, this._parents, name, id);
   }

   selection.prototype.interrupt = selection_interrupt;
   selection.prototype.transition = selection_transition;

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
       this._storage = null;
     }

     if ( Observable ) SiftStorage.__proto__ = Observable;
     SiftStorage.prototype = Object.create( Observable && Observable.prototype );
     SiftStorage.prototype.constructor = SiftStorage;

     SiftStorage.prototype.init = function init (storage) {
       this._storage = storage;
     };

     SiftStorage.prototype.get = function get (d) { return this._storage.get(d) };
     SiftStorage.prototype.getIndexKeys = function getIndexKeys (d) { return this._storage.getIndexKeys(d) };
     SiftStorage.prototype.getIndex = function getIndex (d) { return this._storage.getIndex(d) };
     SiftStorage.prototype.getWithIndex = function getWithIndex (d) { return this._storage.getWithIndex(d) };
     SiftStorage.prototype.getAllKeys = function getAllKeys (d) { return this._storage.getAllKeys(d) };
     SiftStorage.prototype.getAll = function getAll (d) { return this._storage.getAll(d) };
     SiftStorage.prototype.getUser = function getUser (d) { return this._storage.getUser(d) };
     SiftStorage.prototype.putUser = function putUser (d) { return this._storage.putUser(d) };
     SiftStorage.prototype.delUser = function delUser (d) { return this._storage.delUser(d) };

     return SiftStorage;
   }(Observable));

   var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

   function createCommonjsModule(fn, module) {
   	return module = { exports: {} }, fn(module, module.exports), module.exports;
   }

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

   var SiftView = function SiftView() {
     this._resizeHandler = null;
     this._proxy = parent;
     this.controller = new Observable();
     this._registerMessageListeners();
   };

   SiftView.prototype.publish = function publish (topic, value) {
    this._proxy.postMessage({
       method: 'notifyController',
       params: {
         topic: topic,
         value: value } },
       '*');
   };

   SiftView.prototype.registerOnLoadHandler = function registerOnLoadHandler (handler) {
     window.addEventListener('load', handler);
   };

   // TODO: should we really limit resize events to every 1 second?
   SiftView.prototype.registerOnResizeHandler = function registerOnResizeHandler (handler, resizeTimeout) {
       var this$1 = this;
       if ( resizeTimeout === void 0 ) resizeTimeout = 1000;

     window.addEventListener('resize', function () {
       if (!this$1.resizeHandler) {
         this$1.resizeHandler = setTimeout(function () {
           this$1.resizeHandler = null;
           handler();
         }, resizeTimeout);
       }
     });
   };

   SiftView.prototype._registerMessageListeners = function _registerMessageListeners () {
       var this$1 = this;

     window.addEventListener('message', function (e) {
       var method = e.data.method;
       var params = e.data.params;
       if(method === 'notifyView') {
         this$1.controller.publish(params.topic, params.value);
       }
       else if(this$1[method]) {
         this$1[method](params);
       }
       else {
         console.warn('[SiftView]: method not implemented: ', method);
       }
     }, false);
   };

   /**
    * SiftView
    */
   function registerSiftView(siftView) {
     console.log('[Redsift::registerSiftView]: registered');
   }

   function node_each(callback) {
     var node = this, current, next = [node], children, i, n;
     do {
       current = next.reverse(), next = [];
       while (node = current.pop()) {
         callback(node), children = node.children;
         if (children) for (i = 0, n = children.length; i < n; ++i) {
           next.push(children[i]);
         }
       }
     } while (next.length);
     return this;
   }

   function node_eachBefore(callback) {
     var node = this, nodes = [node], children, i;
     while (node = nodes.pop()) {
       callback(node), children = node.children;
       if (children) for (i = children.length - 1; i >= 0; --i) {
         nodes.push(children[i]);
       }
     }
     return this;
   }

   function node_eachAfter(callback) {
     var node = this, nodes = [node], next = [], children, i, n;
     while (node = nodes.pop()) {
       next.push(node), children = node.children;
       if (children) for (i = 0, n = children.length; i < n; ++i) {
         nodes.push(children[i]);
       }
     }
     while (node = next.pop()) {
       callback(node);
     }
     return this;
   }

   function node_sum(value) {
     return this.eachAfter(function(node) {
       var sum = +value(node.data) || 0,
           children = node.children,
           i = children && children.length;
       while (--i >= 0) sum += children[i].value;
       node.value = sum;
     });
   }

   function node_sort(compare) {
     return this.eachBefore(function(node) {
       if (node.children) {
         node.children.sort(compare);
       }
     });
   }

   function node_path(end) {
     var start = this,
         ancestor = leastCommonAncestor(start, end),
         nodes = [start];
     while (start !== ancestor) {
       start = start.parent;
       nodes.push(start);
     }
     var k = nodes.length;
     while (end !== ancestor) {
       nodes.splice(k, 0, end);
       end = end.parent;
     }
     return nodes;
   }

   function leastCommonAncestor(a, b) {
     if (a === b) return a;
     var aNodes = a.ancestors(),
         bNodes = b.ancestors(),
         c = null;
     a = aNodes.pop();
     b = bNodes.pop();
     while (a === b) {
       c = a;
       a = aNodes.pop();
       b = bNodes.pop();
     }
     return c;
   }

   function node_ancestors() {
     var node = this, nodes = [node];
     while (node = node.parent) {
       nodes.push(node);
     }
     return nodes;
   }

   function node_descendants() {
     var nodes = [];
     this.each(function(node) {
       nodes.push(node);
     });
     return nodes;
   }

   function node_leaves() {
     var leaves = [];
     this.eachBefore(function(node) {
       if (!node.children) {
         leaves.push(node);
       }
     });
     return leaves;
   }

   function node_links() {
     var root = this, links = [];
     root.each(function(node) {
       if (node !== root) { // Don’t include the root’s parent, if any.
         links.push({source: node.parent, target: node});
       }
     });
     return links;
   }

   function hierarchy(data, children) {
     var root = new Node(data),
         valued = +data.value && (root.value = data.value),
         node,
         nodes = [root],
         child,
         childs,
         i,
         n;

     if (children == null) children = defaultChildren;

     while (node = nodes.pop()) {
       if (valued) node.value = +node.data.value;
       if ((childs = children(node.data)) && (n = childs.length)) {
         node.children = new Array(n);
         for (i = n - 1; i >= 0; --i) {
           nodes.push(child = node.children[i] = new Node(childs[i]));
           child.parent = node;
           child.depth = node.depth + 1;
         }
       }
     }

     return root.eachBefore(computeHeight);
   }

   function node_copy() {
     return hierarchy(this).eachBefore(copyData);
   }

   function defaultChildren(d) {
     return d.children;
   }

   function copyData(node) {
     node.data = node.data.data;
   }

   function computeHeight(node) {
     var height = 0;
     do node.height = height;
     while ((node = node.parent) && (node.height < ++height));
   }

   function Node(data) {
     this.data = data;
     this.depth =
     this.height = 0;
     this.parent = null;
   }

   Node.prototype = hierarchy.prototype = {
     constructor: Node,
     each: node_each,
     eachAfter: node_eachAfter,
     eachBefore: node_eachBefore,
     sum: node_sum,
     sort: node_sort,
     path: node_path,
     ancestors: node_ancestors,
     descendants: node_descendants,
     leaves: node_leaves,
     links: node_links,
     copy: node_copy
   };

   function required(f) {
     if (typeof f !== "function") throw new Error;
     return f;
   }

   function constantZero() {
     return 0;
   }

   function constant$2(x) {
     return function() {
       return x;
     };
   }

   function roundNode(node) {
     node.x0 = Math.round(node.x0);
     node.y0 = Math.round(node.y0);
     node.x1 = Math.round(node.x1);
     node.y1 = Math.round(node.y1);
   }

   function treemapDice(parent, x0, y0, x1, y1) {
     var nodes = parent.children,
         node,
         i = -1,
         n = nodes.length,
         k = parent.value && (x1 - x0) / parent.value;

     while (++i < n) {
       node = nodes[i], node.y0 = y0, node.y1 = y1;
       node.x0 = x0, node.x1 = x0 += node.value * k;
     }
   }

   function treemapSlice(parent, x0, y0, x1, y1) {
     var nodes = parent.children,
         node,
         i = -1,
         n = nodes.length,
         k = parent.value && (y1 - y0) / parent.value;

     while (++i < n) {
       node = nodes[i], node.x0 = x0, node.x1 = x1;
       node.y0 = y0, node.y1 = y0 += node.value * k;
     }
   }

   var phi = (1 + Math.sqrt(5)) / 2;

   function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
     var rows = [],
         nodes = parent.children,
         row,
         nodeValue,
         i0 = 0,
         i1,
         n = nodes.length,
         dx, dy,
         value = parent.value,
         sumValue,
         minValue,
         maxValue,
         newRatio,
         minRatio,
         alpha,
         beta;

     while (i0 < n) {
       dx = x1 - x0, dy = y1 - y0;
       minValue = maxValue = sumValue = nodes[i0].value;
       alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
       beta = sumValue * sumValue * alpha;
       minRatio = Math.max(maxValue / beta, beta / minValue);

       // Keep adding nodes while the aspect ratio maintains or improves.
       for (i1 = i0 + 1; i1 < n; ++i1) {
         sumValue += nodeValue = nodes[i1].value;
         if (nodeValue < minValue) minValue = nodeValue;
         if (nodeValue > maxValue) maxValue = nodeValue;
         beta = sumValue * sumValue * alpha;
         newRatio = Math.max(maxValue / beta, beta / minValue);
         if (newRatio > minRatio) { sumValue -= nodeValue; break; }
         minRatio = newRatio;
       }

       // Position and record the row orientation.
       rows.push(row = {value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1)});
       if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
       else treemapSlice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
       value -= sumValue, i0 = i1;
     }

     return rows;
   }

   var squarify = (function custom(ratio) {

     function squarify(parent, x0, y0, x1, y1) {
       squarifyRatio(ratio, parent, x0, y0, x1, y1);
     }

     squarify.ratio = function(x) {
       return custom((x = +x) > 1 ? x : 1);
     };

     return squarify;
   })(phi);

   function treemap() {
     var tile = squarify,
         round = false,
         dx = 1,
         dy = 1,
         paddingStack = [0],
         paddingInner = constantZero,
         paddingTop = constantZero,
         paddingRight = constantZero,
         paddingBottom = constantZero,
         paddingLeft = constantZero;

     function treemap(root) {
       root.x0 =
       root.y0 = 0;
       root.x1 = dx;
       root.y1 = dy;
       root.eachBefore(positionNode);
       paddingStack = [0];
       if (round) root.eachBefore(roundNode);
       return root;
     }

     function positionNode(node) {
       var p = paddingStack[node.depth],
           x0 = node.x0 + p,
           y0 = node.y0 + p,
           x1 = node.x1 - p,
           y1 = node.y1 - p;
       if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
       if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
       node.x0 = x0;
       node.y0 = y0;
       node.x1 = x1;
       node.y1 = y1;
       if (node.children) {
         p = paddingStack[node.depth + 1] = paddingInner(node) / 2;
         x0 += paddingLeft(node) - p;
         y0 += paddingTop(node) - p;
         x1 -= paddingRight(node) - p;
         y1 -= paddingBottom(node) - p;
         if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
         if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
         tile(node, x0, y0, x1, y1);
       }
     }

     treemap.round = function(x) {
       return arguments.length ? (round = !!x, treemap) : round;
     };

     treemap.size = function(x) {
       return arguments.length ? (dx = +x[0], dy = +x[1], treemap) : [dx, dy];
     };

     treemap.tile = function(x) {
       return arguments.length ? (tile = required(x), treemap) : tile;
     };

     treemap.padding = function(x) {
       return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner();
     };

     treemap.paddingInner = function(x) {
       return arguments.length ? (paddingInner = typeof x === "function" ? x : constant$2(+x), treemap) : paddingInner;
     };

     treemap.paddingOuter = function(x) {
       return arguments.length ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x) : treemap.paddingTop();
     };

     treemap.paddingTop = function(x) {
       return arguments.length ? (paddingTop = typeof x === "function" ? x : constant$2(+x), treemap) : paddingTop;
     };

     treemap.paddingRight = function(x) {
       return arguments.length ? (paddingRight = typeof x === "function" ? x : constant$2(+x), treemap) : paddingRight;
     };

     treemap.paddingBottom = function(x) {
       return arguments.length ? (paddingBottom = typeof x === "function" ? x : constant$2(+x), treemap) : paddingBottom;
     };

     treemap.paddingLeft = function(x) {
       return arguments.length ? (paddingLeft = typeof x === "function" ? x : constant$2(+x), treemap) : paddingLeft;
     };

     return treemap;
   }

   (function custom(ratio) {

     function resquarify(parent, x0, y0, x1, y1) {
       if ((rows = parent._squarify) && (rows.ratio === ratio)) {
         var rows,
             row,
             nodes,
             i,
             j = -1,
             n,
             m = rows.length,
             value = parent.value;

         while (++j < m) {
           row = rows[j], nodes = row.children;
           for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
           if (row.dice) treemapDice(row, x0, y0, x1, y0 += (y1 - y0) * row.value / value);
           else treemapSlice(row, x0, y0, x0 += (x1 - x0) * row.value / value, y1);
           value -= row.value;
         }
       } else {
         parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1);
         rows.ratio = ratio;
       }
     }

     resquarify.ratio = function(x) {
       return custom((x = +x) > 1 ? x : 1);
     };

     return resquarify;
   })(phi);

   function ascending$1(a, b) {
     return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
   }

   function bisector(compare) {
     if (compare.length === 1) compare = ascendingComparator(compare);
     return {
       left: function(a, x, lo, hi) {
         if (lo == null) lo = 0;
         if (hi == null) hi = a.length;
         while (lo < hi) {
           var mid = lo + hi >>> 1;
           if (compare(a[mid], x) < 0) lo = mid + 1;
           else hi = mid;
         }
         return lo;
       },
       right: function(a, x, lo, hi) {
         if (lo == null) lo = 0;
         if (hi == null) hi = a.length;
         while (lo < hi) {
           var mid = lo + hi >>> 1;
           if (compare(a[mid], x) > 0) hi = mid;
           else lo = mid + 1;
         }
         return lo;
       }
     };
   }

   function ascendingComparator(f) {
     return function(d, x) {
       return ascending$1(f(d), x);
     };
   }

   var ascendingBisect = bisector(ascending$1);

   var prefix = "$";

   function Map() {}

   Map.prototype = map$1.prototype = {
     constructor: Map,
     has: function(key) {
       return (prefix + key) in this;
     },
     get: function(key) {
       return this[prefix + key];
     },
     set: function(key, value) {
       this[prefix + key] = value;
       return this;
     },
     remove: function(key) {
       var property = prefix + key;
       return property in this && delete this[property];
     },
     clear: function() {
       var this$1 = this;

       for (var property in this) if (property[0] === prefix) delete this$1[property];
     },
     keys: function() {
       var keys = [];
       for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
       return keys;
     },
     values: function() {
       var this$1 = this;

       var values = [];
       for (var property in this) if (property[0] === prefix) values.push(this$1[property]);
       return values;
     },
     entries: function() {
       var this$1 = this;

       var entries = [];
       for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this$1[property]});
       return entries;
     },
     size: function() {
       var size = 0;
       for (var property in this) if (property[0] === prefix) ++size;
       return size;
     },
     empty: function() {
       for (var property in this) if (property[0] === prefix) return false;
       return true;
     },
     each: function(f) {
       var this$1 = this;

       for (var property in this) if (property[0] === prefix) f(this$1[property], property.slice(1), this$1);
     }
   };

   function map$1(object, f) {
     var map = new Map;

     // Copy constructor.
     if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

     // Index array by numeric index or specified key function.
     else if (Array.isArray(object)) {
       var i = -1,
           n = object.length,
           o;

       if (f == null) while (++i < n) map.set(i, object[i]);
       else while (++i < n) map.set(f(o = object[i], i, object), o);
     }

     // Convert object to map.
     else if (object) for (var key in object) map.set(key, object[key]);

     return map;
   }

   var proto = map$1.prototype;

   var array$2 = Array.prototype;

   var slice$1 = array$2.slice;

   var implicit = {name: "implicit"};

   function ordinal(range) {
     var index = map$1(),
         domain = [],
         unknown = implicit;

     range = range == null ? [] : slice$1.call(range);

     function scale(d) {
       var key = d + "", i = index.get(key);
       if (!i) {
         if (unknown !== implicit) return unknown;
         index.set(key, i = domain.push(d));
       }
       return range[(i - 1) % range.length];
     }

     scale.domain = function(_) {
       if (!arguments.length) return domain.slice();
       domain = [], index = map$1();
       var i = -1, n = _.length, d, key;
       while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
       return scale;
     };

     scale.range = function(_) {
       return arguments.length ? (range = slice$1.call(_), scale) : range.slice();
     };

     scale.unknown = function(_) {
       return arguments.length ? (unknown = _, scale) : unknown;
     };

     scale.copy = function() {
       return ordinal()
           .domain(domain)
           .range(range)
           .unknown(unknown);
     };

     return scale;
   }

   // Computes the decimal coefficient and exponent of the specified number x with
   // significant digits p, where x is positive and p is in [1, 21] or undefined.
   // For example, formatDecimal(1.23) returns ["123", 0].
   function formatDecimal(x, p) {
     if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
     var i, coefficient = x.slice(0, i);

     // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
     // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
     return [
       coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
       +x.slice(i + 1)
     ];
   }

   function exponent$1(x) {
     return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
   }

   function formatGroup(grouping, thousands) {
     return function(value, width) {
       var i = value.length,
           t = [],
           j = 0,
           g = grouping[0],
           length = 0;

       while (i > 0 && g > 0) {
         if (length + g + 1 > width) g = Math.max(1, width - length);
         t.push(value.substring(i -= g, i + g));
         if ((length += g + 1) > width) break;
         g = grouping[j = (j + 1) % grouping.length];
       }

       return t.reverse().join(thousands);
     };
   }

   function formatDefault(x, p) {
     x = x.toPrecision(p);

     out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
       switch (x[i]) {
         case ".": i0 = i1 = i; break;
         case "0": if (i0 === 0) i0 = i; i1 = i; break;
         case "e": break out;
         default: if (i0 > 0) i0 = 0; break;
       }
     }

     return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
   }

   var prefixExponent;

   function formatPrefixAuto(x, p) {
     var d = formatDecimal(x, p);
     if (!d) return x + "";
     var coefficient = d[0],
         exponent = d[1],
         i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
         n = coefficient.length;
     return i === n ? coefficient
         : i > n ? coefficient + new Array(i - n + 1).join("0")
         : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
         : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
   }

   function formatRounded(x, p) {
     var d = formatDecimal(x, p);
     if (!d) return x + "";
     var coefficient = d[0],
         exponent = d[1];
     return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
         : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
         : coefficient + new Array(exponent - coefficient.length + 2).join("0");
   }

   var formatTypes = {
     "": formatDefault,
     "%": function(x, p) { return (x * 100).toFixed(p); },
     "b": function(x) { return Math.round(x).toString(2); },
     "c": function(x) { return x + ""; },
     "d": function(x) { return Math.round(x).toString(10); },
     "e": function(x, p) { return x.toExponential(p); },
     "f": function(x, p) { return x.toFixed(p); },
     "g": function(x, p) { return x.toPrecision(p); },
     "o": function(x) { return Math.round(x).toString(8); },
     "p": function(x, p) { return formatRounded(x * 100, p); },
     "r": formatRounded,
     "s": formatPrefixAuto,
     "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
     "x": function(x) { return Math.round(x).toString(16); }
   };

   // [[fill]align][sign][symbol][0][width][,][.precision][type]
   var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

   function formatSpecifier(specifier) {
     return new FormatSpecifier(specifier);
   }

   function FormatSpecifier(specifier) {
     if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

     var match,
         fill = match[1] || " ",
         align = match[2] || ">",
         sign = match[3] || "-",
         symbol = match[4] || "",
         zero = !!match[5],
         width = match[6] && +match[6],
         comma = !!match[7],
         precision = match[8] && +match[8].slice(1),
         type = match[9] || "";

     // The "n" type is an alias for ",g".
     if (type === "n") comma = true, type = "g";

     // Map invalid types to the default format.
     else if (!formatTypes[type]) type = "";

     // If zero fill is specified, padding goes after sign and before digits.
     if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

     this.fill = fill;
     this.align = align;
     this.sign = sign;
     this.symbol = symbol;
     this.zero = zero;
     this.width = width;
     this.comma = comma;
     this.precision = precision;
     this.type = type;
   }

   FormatSpecifier.prototype.toString = function() {
     return this.fill
         + this.align
         + this.sign
         + this.symbol
         + (this.zero ? "0" : "")
         + (this.width == null ? "" : Math.max(1, this.width | 0))
         + (this.comma ? "," : "")
         + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
         + this.type;
   };

   var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

   function identity$3(x) {
     return x;
   }

   function formatLocale(locale) {
     var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$3,
         currency = locale.currency,
         decimal = locale.decimal;

     function newFormat(specifier) {
       specifier = formatSpecifier(specifier);

       var fill = specifier.fill,
           align = specifier.align,
           sign = specifier.sign,
           symbol = specifier.symbol,
           zero = specifier.zero,
           width = specifier.width,
           comma = specifier.comma,
           precision = specifier.precision,
           type = specifier.type;

       // Compute the prefix and suffix.
       // For SI-prefix, the suffix is lazily computed.
       var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
           suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

       // What format function should we use?
       // Is this an integer type?
       // Can this type generate exponential notation?
       var formatType = formatTypes[type],
           maybeSuffix = !type || /[defgprs%]/.test(type);

       // Set the default precision if not specified,
       // or clamp the specified precision to the supported range.
       // For significant precision, it must be in [1, 21].
       // For fixed precision, it must be in [0, 20].
       precision = precision == null ? (type ? 6 : 12)
           : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
           : Math.max(0, Math.min(20, precision));

       function format(value) {
         var valuePrefix = prefix,
             valueSuffix = suffix,
             i, n, c;

         if (type === "c") {
           valueSuffix = formatType(value) + valueSuffix;
           value = "";
         } else {
           value = +value;

           // Convert negative to positive, and compute the prefix.
           // Note that -0 is not less than 0, but 1 / -0 is!
           var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

           // Perform the initial formatting.
           value = formatType(value, precision);

           // If the original value was negative, it may be rounded to zero during
           // formatting; treat this as (positive) zero.
           if (valueNegative) {
             i = -1, n = value.length;
             valueNegative = false;
             while (++i < n) {
               if (c = value.charCodeAt(i), (48 < c && c < 58)
                   || (type === "x" && 96 < c && c < 103)
                   || (type === "X" && 64 < c && c < 71)) {
                 valueNegative = true;
                 break;
               }
             }
           }

           // Compute the prefix and suffix.
           valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
           valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

           // Break the formatted value into the integer “value” part that can be
           // grouped, and fractional or exponential “suffix” part that is not.
           if (maybeSuffix) {
             i = -1, n = value.length;
             while (++i < n) {
               if (c = value.charCodeAt(i), 48 > c || c > 57) {
                 valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                 value = value.slice(0, i);
                 break;
               }
             }
           }
         }

         // If the fill character is not "0", grouping is applied before padding.
         if (comma && !zero) value = group(value, Infinity);

         // Compute the padding.
         var length = valuePrefix.length + value.length + valueSuffix.length,
             padding = length < width ? new Array(width - length + 1).join(fill) : "";

         // If the fill character is "0", grouping is applied after padding.
         if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

         // Reconstruct the final output based on the desired alignment.
         switch (align) {
           case "<": return valuePrefix + value + valueSuffix + padding;
           case "=": return valuePrefix + padding + value + valueSuffix;
           case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
         }
         return padding + valuePrefix + value + valueSuffix;
       }

       format.toString = function() {
         return specifier + "";
       };

       return format;
     }

     function formatPrefix(specifier, value) {
       var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
           e = Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3,
           k = Math.pow(10, -e),
           prefix = prefixes[8 + e / 3];
       return function(value) {
         return f(k * value) + prefix;
       };
     }

     return {
       format: newFormat,
       formatPrefix: formatPrefix
     };
   }

   var locale;
   var format;
   var formatPrefix;

   defaultLocale({
     decimal: ".",
     thousands: ",",
     grouping: [3],
     currency: ["$", ""]
   });

   function defaultLocale(definition) {
     locale = formatLocale(definition);
     format = locale.format;
     formatPrefix = locale.formatPrefix;
     return locale;
   }

var    t0$1 = new Date;
var    t1$1 = new Date;
   function newInterval(floori, offseti, count, field) {

     function interval(date) {
       return floori(date = new Date(+date)), date;
     }

     interval.floor = interval;

     interval.ceil = function(date) {
       return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
     };

     interval.round = function(date) {
       var d0 = interval(date),
           d1 = interval.ceil(date);
       return date - d0 < d1 - date ? d0 : d1;
     };

     interval.offset = function(date, step) {
       return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
     };

     interval.range = function(start, stop, step) {
       var range = [];
       start = interval.ceil(start);
       step = step == null ? 1 : Math.floor(step);
       if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
       do range.push(new Date(+start)); while (offseti(start, step), floori(start), start < stop)
       return range;
     };

     interval.filter = function(test) {
       return newInterval(function(date) {
         while (floori(date), !test(date)) date.setTime(date - 1);
       }, function(date, step) {
         while (--step >= 0) while (offseti(date, 1), !test(date));
       });
     };

     if (count) {
       interval.count = function(start, end) {
         t0$1.setTime(+start), t1$1.setTime(+end);
         floori(t0$1), floori(t1$1);
         return Math.floor(count(t0$1, t1$1));
       };

       interval.every = function(step) {
         step = Math.floor(step);
         return !isFinite(step) || !(step > 0) ? null
             : !(step > 1) ? interval
             : interval.filter(field
                 ? function(d) { return field(d) % step === 0; }
                 : function(d) { return interval.count(0, d) % step === 0; });
       };
     }

     return interval;
   }

   var millisecond = newInterval(function() {
     // noop
   }, function(date, step) {
     date.setTime(+date + step);
   }, function(start, end) {
     return end - start;
   });

   // An optimized implementation for this simple case.
   millisecond.every = function(k) {
     k = Math.floor(k);
     if (!isFinite(k) || !(k > 0)) return null;
     if (!(k > 1)) return millisecond;
     return newInterval(function(date) {
       date.setTime(Math.floor(date / k) * k);
     }, function(date, step) {
       date.setTime(+date + step * k);
     }, function(start, end) {
       return (end - start) / k;
     });
   };

   var durationSecond$1 = 1e3;
   var durationMinute$1 = 6e4;
   var durationHour$1 = 36e5;
   var durationDay$1 = 864e5;
   var durationWeek$1 = 6048e5;

   var second = newInterval(function(date) {
     date.setTime(Math.floor(date / durationSecond$1) * durationSecond$1);
   }, function(date, step) {
     date.setTime(+date + step * durationSecond$1);
   }, function(start, end) {
     return (end - start) / durationSecond$1;
   }, function(date) {
     return date.getUTCSeconds();
   });

   var minute = newInterval(function(date) {
     date.setTime(Math.floor(date / durationMinute$1) * durationMinute$1);
   }, function(date, step) {
     date.setTime(+date + step * durationMinute$1);
   }, function(start, end) {
     return (end - start) / durationMinute$1;
   }, function(date) {
     return date.getMinutes();
   });

   var hour = newInterval(function(date) {
     var offset = date.getTimezoneOffset() * durationMinute$1 % durationHour$1;
     if (offset < 0) offset += durationHour$1;
     date.setTime(Math.floor((+date - offset) / durationHour$1) * durationHour$1 + offset);
   }, function(date, step) {
     date.setTime(+date + step * durationHour$1);
   }, function(start, end) {
     return (end - start) / durationHour$1;
   }, function(date) {
     return date.getHours();
   });

   var day = newInterval(function(date) {
     date.setHours(0, 0, 0, 0);
   }, function(date, step) {
     date.setDate(date.getDate() + step);
   }, function(start, end) {
     return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationDay$1;
   }, function(date) {
     return date.getDate() - 1;
   });

   function weekday(i) {
     return newInterval(function(date) {
       date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
       date.setHours(0, 0, 0, 0);
     }, function(date, step) {
       date.setDate(date.getDate() + step * 7);
     }, function(start, end) {
       return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationWeek$1;
     });
   }

   var timeSunday = weekday(0);
   var timeMonday = weekday(1);

   var month = newInterval(function(date) {
     date.setDate(1);
     date.setHours(0, 0, 0, 0);
   }, function(date, step) {
     date.setMonth(date.getMonth() + step);
   }, function(start, end) {
     return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
   }, function(date) {
     return date.getMonth();
   });

   var year = newInterval(function(date) {
     date.setMonth(0, 1);
     date.setHours(0, 0, 0, 0);
   }, function(date, step) {
     date.setFullYear(date.getFullYear() + step);
   }, function(start, end) {
     return end.getFullYear() - start.getFullYear();
   }, function(date) {
     return date.getFullYear();
   });

   // An optimized implementation for this simple case.
   year.every = function(k) {
     return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
       date.setFullYear(Math.floor(date.getFullYear() / k) * k);
       date.setMonth(0, 1);
       date.setHours(0, 0, 0, 0);
     }, function(date, step) {
       date.setFullYear(date.getFullYear() + step * k);
     });
   };

   var utcMinute = newInterval(function(date) {
     date.setUTCSeconds(0, 0);
   }, function(date, step) {
     date.setTime(+date + step * durationMinute$1);
   }, function(start, end) {
     return (end - start) / durationMinute$1;
   }, function(date) {
     return date.getUTCMinutes();
   });

   var utcHour = newInterval(function(date) {
     date.setUTCMinutes(0, 0, 0);
   }, function(date, step) {
     date.setTime(+date + step * durationHour$1);
   }, function(start, end) {
     return (end - start) / durationHour$1;
   }, function(date) {
     return date.getUTCHours();
   });

   var utcDay = newInterval(function(date) {
     date.setUTCHours(0, 0, 0, 0);
   }, function(date, step) {
     date.setUTCDate(date.getUTCDate() + step);
   }, function(start, end) {
     return (end - start) / durationDay$1;
   }, function(date) {
     return date.getUTCDate() - 1;
   });

   function utcWeekday(i) {
     return newInterval(function(date) {
       date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
       date.setUTCHours(0, 0, 0, 0);
     }, function(date, step) {
       date.setUTCDate(date.getUTCDate() + step * 7);
     }, function(start, end) {
       return (end - start) / durationWeek$1;
     });
   }

   var utcWeek = utcWeekday(0);
   var utcMonday = utcWeekday(1);

   var utcMonth = newInterval(function(date) {
     date.setUTCDate(1);
     date.setUTCHours(0, 0, 0, 0);
   }, function(date, step) {
     date.setUTCMonth(date.getUTCMonth() + step);
   }, function(start, end) {
     return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
   }, function(date) {
     return date.getUTCMonth();
   });

   var utcYear = newInterval(function(date) {
     date.setUTCMonth(0, 1);
     date.setUTCHours(0, 0, 0, 0);
   }, function(date, step) {
     date.setUTCFullYear(date.getUTCFullYear() + step);
   }, function(start, end) {
     return end.getUTCFullYear() - start.getUTCFullYear();
   }, function(date) {
     return date.getUTCFullYear();
   });

   // An optimized implementation for this simple case.
   utcYear.every = function(k) {
     return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
       date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
       date.setUTCMonth(0, 1);
       date.setUTCHours(0, 0, 0, 0);
     }, function(date, step) {
       date.setUTCFullYear(date.getUTCFullYear() + step * k);
     });
   };

   function localDate(d) {
     if (0 <= d.y && d.y < 100) {
       var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
       date.setFullYear(d.y);
       return date;
     }
     return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
   }

   function utcDate(d) {
     if (0 <= d.y && d.y < 100) {
       var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
       date.setUTCFullYear(d.y);
       return date;
     }
     return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
   }

   function newYear(y) {
     return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
   }

   function formatLocale$1(locale) {
     var locale_dateTime = locale.dateTime,
         locale_date = locale.date,
         locale_time = locale.time,
         locale_periods = locale.periods,
         locale_weekdays = locale.days,
         locale_shortWeekdays = locale.shortDays,
         locale_months = locale.months,
         locale_shortMonths = locale.shortMonths;

     var periodRe = formatRe(locale_periods),
         periodLookup = formatLookup(locale_periods),
         weekdayRe = formatRe(locale_weekdays),
         weekdayLookup = formatLookup(locale_weekdays),
         shortWeekdayRe = formatRe(locale_shortWeekdays),
         shortWeekdayLookup = formatLookup(locale_shortWeekdays),
         monthRe = formatRe(locale_months),
         monthLookup = formatLookup(locale_months),
         shortMonthRe = formatRe(locale_shortMonths),
         shortMonthLookup = formatLookup(locale_shortMonths);

     var formats = {
       "a": formatShortWeekday,
       "A": formatWeekday,
       "b": formatShortMonth,
       "B": formatMonth,
       "c": null,
       "d": formatDayOfMonth,
       "e": formatDayOfMonth,
       "H": formatHour24,
       "I": formatHour12,
       "j": formatDayOfYear,
       "L": formatMilliseconds,
       "m": formatMonthNumber,
       "M": formatMinutes,
       "p": formatPeriod,
       "S": formatSeconds,
       "U": formatWeekNumberSunday,
       "w": formatWeekdayNumber,
       "W": formatWeekNumberMonday,
       "x": null,
       "X": null,
       "y": formatYear,
       "Y": formatFullYear,
       "Z": formatZone,
       "%": formatLiteralPercent
     };

     var utcFormats = {
       "a": formatUTCShortWeekday,
       "A": formatUTCWeekday,
       "b": formatUTCShortMonth,
       "B": formatUTCMonth,
       "c": null,
       "d": formatUTCDayOfMonth,
       "e": formatUTCDayOfMonth,
       "H": formatUTCHour24,
       "I": formatUTCHour12,
       "j": formatUTCDayOfYear,
       "L": formatUTCMilliseconds,
       "m": formatUTCMonthNumber,
       "M": formatUTCMinutes,
       "p": formatUTCPeriod,
       "S": formatUTCSeconds,
       "U": formatUTCWeekNumberSunday,
       "w": formatUTCWeekdayNumber,
       "W": formatUTCWeekNumberMonday,
       "x": null,
       "X": null,
       "y": formatUTCYear,
       "Y": formatUTCFullYear,
       "Z": formatUTCZone,
       "%": formatLiteralPercent
     };

     var parses = {
       "a": parseShortWeekday,
       "A": parseWeekday,
       "b": parseShortMonth,
       "B": parseMonth,
       "c": parseLocaleDateTime,
       "d": parseDayOfMonth,
       "e": parseDayOfMonth,
       "H": parseHour24,
       "I": parseHour24,
       "j": parseDayOfYear,
       "L": parseMilliseconds,
       "m": parseMonthNumber,
       "M": parseMinutes,
       "p": parsePeriod,
       "S": parseSeconds,
       "U": parseWeekNumberSunday,
       "w": parseWeekdayNumber,
       "W": parseWeekNumberMonday,
       "x": parseLocaleDate,
       "X": parseLocaleTime,
       "y": parseYear,
       "Y": parseFullYear,
       "Z": parseZone,
       "%": parseLiteralPercent
     };

     // These recursive directive definitions must be deferred.
     formats.x = newFormat(locale_date, formats);
     formats.X = newFormat(locale_time, formats);
     formats.c = newFormat(locale_dateTime, formats);
     utcFormats.x = newFormat(locale_date, utcFormats);
     utcFormats.X = newFormat(locale_time, utcFormats);
     utcFormats.c = newFormat(locale_dateTime, utcFormats);

     function newFormat(specifier, formats) {
       return function(date) {
         var string = [],
             i = -1,
             j = 0,
             n = specifier.length,
             c,
             pad,
             format;

         if (!(date instanceof Date)) date = new Date(+date);

         while (++i < n) {
           if (specifier.charCodeAt(i) === 37) {
             string.push(specifier.slice(j, i));
             if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
             else pad = c === "e" ? " " : "0";
             if (format = formats[c]) c = format(date, pad);
             string.push(c);
             j = i + 1;
           }
         }

         string.push(specifier.slice(j, i));
         return string.join("");
       };
     }

     function newParse(specifier, newDate) {
       return function(string) {
         var d = newYear(1900),
             i = parseSpecifier(d, specifier, string += "", 0);
         if (i != string.length) return null;

         // The am-pm flag is 0 for AM, and 1 for PM.
         if ("p" in d) d.H = d.H % 12 + d.p * 12;

         // Convert day-of-week and week-of-year to day-of-year.
         if ("W" in d || "U" in d) {
           if (!("w" in d)) d.w = "W" in d ? 1 : 0;
           var day = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
           d.m = 0;
           d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
         }

         // If a time zone is specified, all fields are interpreted as UTC and then
         // offset according to the specified time zone.
         if ("Z" in d) {
           d.H += d.Z / 100 | 0;
           d.M += d.Z % 100;
           return utcDate(d);
         }

         // Otherwise, all fields are in local time.
         return newDate(d);
       };
     }

     function parseSpecifier(d, specifier, string, j) {
       var i = 0,
           n = specifier.length,
           m = string.length,
           c,
           parse;

       while (i < n) {
         if (j >= m) return -1;
         c = specifier.charCodeAt(i++);
         if (c === 37) {
           c = specifier.charAt(i++);
           parse = parses[c in pads ? specifier.charAt(i++) : c];
           if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
         } else if (c != string.charCodeAt(j++)) {
           return -1;
         }
       }

       return j;
     }

     function parsePeriod(d, string, i) {
       var n = periodRe.exec(string.slice(i));
       return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
     }

     function parseShortWeekday(d, string, i) {
       var n = shortWeekdayRe.exec(string.slice(i));
       return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
     }

     function parseWeekday(d, string, i) {
       var n = weekdayRe.exec(string.slice(i));
       return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
     }

     function parseShortMonth(d, string, i) {
       var n = shortMonthRe.exec(string.slice(i));
       return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
     }

     function parseMonth(d, string, i) {
       var n = monthRe.exec(string.slice(i));
       return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
     }

     function parseLocaleDateTime(d, string, i) {
       return parseSpecifier(d, locale_dateTime, string, i);
     }

     function parseLocaleDate(d, string, i) {
       return parseSpecifier(d, locale_date, string, i);
     }

     function parseLocaleTime(d, string, i) {
       return parseSpecifier(d, locale_time, string, i);
     }

     function formatShortWeekday(d) {
       return locale_shortWeekdays[d.getDay()];
     }

     function formatWeekday(d) {
       return locale_weekdays[d.getDay()];
     }

     function formatShortMonth(d) {
       return locale_shortMonths[d.getMonth()];
     }

     function formatMonth(d) {
       return locale_months[d.getMonth()];
     }

     function formatPeriod(d) {
       return locale_periods[+(d.getHours() >= 12)];
     }

     function formatUTCShortWeekday(d) {
       return locale_shortWeekdays[d.getUTCDay()];
     }

     function formatUTCWeekday(d) {
       return locale_weekdays[d.getUTCDay()];
     }

     function formatUTCShortMonth(d) {
       return locale_shortMonths[d.getUTCMonth()];
     }

     function formatUTCMonth(d) {
       return locale_months[d.getUTCMonth()];
     }

     function formatUTCPeriod(d) {
       return locale_periods[+(d.getUTCHours() >= 12)];
     }

     return {
       format: function(specifier) {
         var f = newFormat(specifier += "", formats);
         f.toString = function() { return specifier; };
         return f;
       },
       parse: function(specifier) {
         var p = newParse(specifier += "", localDate);
         p.toString = function() { return specifier; };
         return p;
       },
       utcFormat: function(specifier) {
         var f = newFormat(specifier += "", utcFormats);
         f.toString = function() { return specifier; };
         return f;
       },
       utcParse: function(specifier) {
         var p = newParse(specifier, utcDate);
         p.toString = function() { return specifier; };
         return p;
       }
     };
   }

   var pads = {"-": "", "_": " ", "0": "0"};
   var numberRe = /^\s*\d+/;
   var percentRe = /^%/;
   var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
   function pad(value, fill, width) {
     var sign = value < 0 ? "-" : "",
         string = (sign ? -value : value) + "",
         length = string.length;
     return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
   }

   function requote(s) {
     return s.replace(requoteRe, "\\$&");
   }

   function formatRe(names) {
     return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
   }

   function formatLookup(names) {
     var map = {}, i = -1, n = names.length;
     while (++i < n) map[names[i].toLowerCase()] = i;
     return map;
   }

   function parseWeekdayNumber(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 1));
     return n ? (d.w = +n[0], i + n[0].length) : -1;
   }

   function parseWeekNumberSunday(d, string, i) {
     var n = numberRe.exec(string.slice(i));
     return n ? (d.U = +n[0], i + n[0].length) : -1;
   }

   function parseWeekNumberMonday(d, string, i) {
     var n = numberRe.exec(string.slice(i));
     return n ? (d.W = +n[0], i + n[0].length) : -1;
   }

   function parseFullYear(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 4));
     return n ? (d.y = +n[0], i + n[0].length) : -1;
   }

   function parseYear(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 2));
     return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
   }

   function parseZone(d, string, i) {
     var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
     return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
   }

   function parseMonthNumber(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 2));
     return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
   }

   function parseDayOfMonth(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 2));
     return n ? (d.d = +n[0], i + n[0].length) : -1;
   }

   function parseDayOfYear(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 3));
     return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
   }

   function parseHour24(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 2));
     return n ? (d.H = +n[0], i + n[0].length) : -1;
   }

   function parseMinutes(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 2));
     return n ? (d.M = +n[0], i + n[0].length) : -1;
   }

   function parseSeconds(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 2));
     return n ? (d.S = +n[0], i + n[0].length) : -1;
   }

   function parseMilliseconds(d, string, i) {
     var n = numberRe.exec(string.slice(i, i + 3));
     return n ? (d.L = +n[0], i + n[0].length) : -1;
   }

   function parseLiteralPercent(d, string, i) {
     var n = percentRe.exec(string.slice(i, i + 1));
     return n ? i + n[0].length : -1;
   }

   function formatDayOfMonth(d, p) {
     return pad(d.getDate(), p, 2);
   }

   function formatHour24(d, p) {
     return pad(d.getHours(), p, 2);
   }

   function formatHour12(d, p) {
     return pad(d.getHours() % 12 || 12, p, 2);
   }

   function formatDayOfYear(d, p) {
     return pad(1 + day.count(year(d), d), p, 3);
   }

   function formatMilliseconds(d, p) {
     return pad(d.getMilliseconds(), p, 3);
   }

   function formatMonthNumber(d, p) {
     return pad(d.getMonth() + 1, p, 2);
   }

   function formatMinutes(d, p) {
     return pad(d.getMinutes(), p, 2);
   }

   function formatSeconds(d, p) {
     return pad(d.getSeconds(), p, 2);
   }

   function formatWeekNumberSunday(d, p) {
     return pad(timeSunday.count(year(d), d), p, 2);
   }

   function formatWeekdayNumber(d) {
     return d.getDay();
   }

   function formatWeekNumberMonday(d, p) {
     return pad(timeMonday.count(year(d), d), p, 2);
   }

   function formatYear(d, p) {
     return pad(d.getFullYear() % 100, p, 2);
   }

   function formatFullYear(d, p) {
     return pad(d.getFullYear() % 10000, p, 4);
   }

   function formatZone(d) {
     var z = d.getTimezoneOffset();
     return (z > 0 ? "-" : (z *= -1, "+"))
         + pad(z / 60 | 0, "0", 2)
         + pad(z % 60, "0", 2);
   }

   function formatUTCDayOfMonth(d, p) {
     return pad(d.getUTCDate(), p, 2);
   }

   function formatUTCHour24(d, p) {
     return pad(d.getUTCHours(), p, 2);
   }

   function formatUTCHour12(d, p) {
     return pad(d.getUTCHours() % 12 || 12, p, 2);
   }

   function formatUTCDayOfYear(d, p) {
     return pad(1 + utcDay.count(utcYear(d), d), p, 3);
   }

   function formatUTCMilliseconds(d, p) {
     return pad(d.getUTCMilliseconds(), p, 3);
   }

   function formatUTCMonthNumber(d, p) {
     return pad(d.getUTCMonth() + 1, p, 2);
   }

   function formatUTCMinutes(d, p) {
     return pad(d.getUTCMinutes(), p, 2);
   }

   function formatUTCSeconds(d, p) {
     return pad(d.getUTCSeconds(), p, 2);
   }

   function formatUTCWeekNumberSunday(d, p) {
     return pad(utcWeek.count(utcYear(d), d), p, 2);
   }

   function formatUTCWeekdayNumber(d) {
     return d.getUTCDay();
   }

   function formatUTCWeekNumberMonday(d, p) {
     return pad(utcMonday.count(utcYear(d), d), p, 2);
   }

   function formatUTCYear(d, p) {
     return pad(d.getUTCFullYear() % 100, p, 2);
   }

   function formatUTCFullYear(d, p) {
     return pad(d.getUTCFullYear() % 10000, p, 4);
   }

   function formatUTCZone() {
     return "+0000";
   }

   function formatLiteralPercent() {
     return "%";
   }

   var locale$1;
   var timeFormat;
   var timeParse;
   var utcFormat;
   var utcParse;

   defaultLocale$1({
     dateTime: "%x, %X",
     date: "%-m/%-d/%Y",
     time: "%-I:%M:%S %p",
     periods: ["AM", "PM"],
     days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
     shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
     months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
     shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
   });

   function defaultLocale$1(definition) {
     locale$1 = formatLocale$1(definition);
     timeFormat = locale$1.format;
     timeParse = locale$1.parse;
     utcFormat = locale$1.utcFormat;
     utcParse = locale$1.utcParse;
     return locale$1;
   }

   var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

   function formatIsoNative(date) {
     return date.toISOString();
   }

   var formatIso = Date.prototype.toISOString
       ? formatIsoNative
       : utcFormat(isoSpecifier);

   function parseIsoNative(string) {
     var date = new Date(string);
     return isNaN(date) ? null : date;
   }

   var parseIso = +new Date("2000-01-01T00:00:00.000Z")
       ? parseIsoNative
       : utcParse(isoSpecifier);

   function colors(s) {
     return s.match(/.{6}/g).map(function(x) {
       return "#" + x;
     });
   }

   colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

   colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

   colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

   colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

   interpolateCubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

   var warm = interpolateCubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

   var cool = interpolateCubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

   var rainbow = cubehelix();

   function ramp(range) {
     var n = range.length;
     return function(t) {
       return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
     };
   }

   ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

   var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

   var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

   var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

   // Informed by the Cagatay Demiralp paper, grey is moved around to break
   // brown and red in this color scheme

   var presentation10dark = [ 
       '#00ce5c', // Green
       '#d800a2', // Pink          
       '#00d9d2', // Aqua     
       '#AF5100', // Brown         
       '#bfbfbf', // Grey   
       '#DE0000', // Red     
       '#F0DE00', // Yellow           
       '#9200ff', // Purple      
       '#ED9200', // Orange     
       '#00aeff' // Blue 
   ];

   var presentation10std = [ 
      
       '#56d58e', // Green
       '#d95cba', // Pink          
       '#63eae4', // Aqua     
       '#C78348', // Brown         
       '#d6d6d6', // Grey 
       '#E06363', // Red     
       '#FFF741', // Yellow           
       '#965ede', // Purple      
       '#FCBB54', // Orange  
       '#73c5eb' // Blue 
   ];

   var presentation10light = [ 
       '#a5e6c3', // Green
       '#eda3da', // Pink          
       '#9af8f4', // Aqua     
       '#EDC19C', // Brown         
       '#e5e5e5', // Grey 
       '#F5AAAA', // Red     
       '#F7EFC3', // Yellow           
       '#c6a8ef', // Purple      
       '#F8D296', // Orange     
       '#addbf0' // Blue 
   ];

   var names10 = {
       green:  0,
       pink:   1,
       aqua:   2,        
       brown:  3,
       grey:   4,
       red:    5,
       yellow: 6,
       purple: 7,
       orange: 8,
       blue:   9
   }

   var presentation10 = {
       standard: presentation10std,
       darker: presentation10dark,
       lighter: presentation10light,
       names: names10    
   }

   var brandstd = [
       '#e11010', // red
       '#0ab93a', // green
       '#1671f4', // blue
       '#cacaca'  // grey
   ]

   var branddark = [
       '#6a0000', // red
       '#087927', // green
       '#0b49a2', // blue
       '#828282'  // grey
   ]

   var namesbrand = {
       red:    0,
       green:  1,
       blue:   2,        
       grey:   3
   }

   var brand = { 
       standard: brandstd, 
       darker: branddark,
       names: namesbrand 
   } 

   var display = { 
       light : {
           background: '#ffffff',
           text: '#262626',
           axis: '#262626',
           grid: '#e0e0e0',
           highlight: 'rgba(225,16,16,0.5)',
           lowlight: 'rgba(127,127,127,0.3)',
           shadow: 'rgba(127,127,127,0.4)',
           fillOpacity: 0.33,
           negative: {
               background: 'rgba(0, 0, 0, 0.66)',
               text: '#ffffff'
           }
       },
       dark : {
           background: '#333333',    
           text: '#ffffff',
           axis: '#ffffff',
           grid: '#6d6d6d',
           highlight: 'rgba(225,16,16,0.5)',
           lowlight: 'rgba(127,127,127,0.5)',
           shadow: 'rgba(255,255,255,0.4)',
           fillOpacity: 0.33,      
           negative: {
               background: 'rgba(255, 255, 255, 0.85)',
               text: '#262626'
           }
       }
   };

   var index$5 = createCommonjsModule(function (module) {
   /**
    * https://github.com/gre/bezier-easing
    * BezierEasing - use bezier curve for transition easing function
    * by Gaëtan Renaudeau 2014 - 2015 – MIT License
    */

   // These values are established by empiricism with tests (tradeoff: performance VS precision)
   var NEWTON_ITERATIONS = 4;
   var NEWTON_MIN_SLOPE = 0.001;
   var SUBDIVISION_PRECISION = 0.0000001;
   var SUBDIVISION_MAX_ITERATIONS = 10;

   var kSplineTableSize = 11;
   var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

   var float32ArraySupported = typeof Float32Array === 'function';

   function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
   function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
   function C (aA1)      { return 3.0 * aA1; }

   // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
   function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

   // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
   function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

   function binarySubdivide (aX, aA, aB, mX1, mX2) {
     var currentX, currentT, i = 0;
     do {
       currentT = aA + (aB - aA) / 2.0;
       currentX = calcBezier(currentT, mX1, mX2) - aX;
       if (currentX > 0.0) {
         aB = currentT;
       } else {
         aA = currentT;
       }
     } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
     return currentT;
   }

   function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
    for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
      var currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) {
        return aGuessT;
      }
      var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
   }

   module.exports = function bezier (mX1, mY1, mX2, mY2) {
     if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
       throw new Error('bezier x values must be in [0, 1] range');
     }

     // Precompute samples table
     var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
     if (mX1 !== mY1 || mX2 !== mY2) {
       for (var i = 0; i < kSplineTableSize; ++i) {
         sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
       }
     }

     function getTForX (aX) {
       var intervalStart = 0.0;
       var currentSample = 1;
       var lastSample = kSplineTableSize - 1;

       for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
         intervalStart += kSampleStepSize;
       }
       --currentSample;

       // Interpolate to provide an initial guess for t
       var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
       var guessForT = intervalStart + dist * kSampleStepSize;

       var initialSlope = getSlope(guessForT, mX1, mX2);
       if (initialSlope >= NEWTON_MIN_SLOPE) {
         return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
       } else if (initialSlope === 0.0) {
         return guessForT;
       } else {
         return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
       }
     }

     return function BezierEasing (x) {
       if (mX1 === mY1 && mX2 === mY2) {
         return x; // linear
       }
       // Because JavaScript number are imprecise, we should guarantee the extremes are right.
       if (x === 0) {
         return 0;
       }
       if (x === 1) {
         return 1;
       }
       return calcBezier(getTForX(x), mY1, mY2);
     };
   };
   });

   var COUNT = 1;

   function scaffold(id, onetime, dynamic, transitions) {
       function _impl(context) {
           var selection = context.selection ? context.selection() : context,
               transition = (context.selection !== undefined);

           var defs = selection.select('defs');
           if (defs.empty()) {
               defs = selection.append('defs');
           }
           
           var filter = defs.select(_impl.self());
           if (filter.empty()) {
               filter = defs.append('filter')
                           .attr('filterUnits', 'objectBoundingBox')
                           .attr('x', '0%')
                           .attr('y', '0%')
                           .attr('width', '100%')
                           .attr('height', '100%')
                           .attr('id', id);

               onetime(filter);
           }        
           
           dynamic(filter);

           if (transition === true) {
               filter = filter.transition(context);
           }
           
           transitions(filter);
       }

       _impl.id = function () { return id; };
       _impl.self = function () { return ("#" + id); };
       
       // .url() can be used with filter on a SVG component
       _impl.url = function () { return ("url(#" + id + ")"); };
       
       // .css() can be used with style on a SVG component
       _impl.css = function () { return ("fill: " + (_impl.url()) + ";"); };

       return _impl;
   }

   function shadow(id) {
       
       var morphRadius = 1,
           color = display.light.shadow,
           blurRadius = 3,
           padding = "10";
       
       if (id == null) {
           id = 'filter-shadow-' + COUNT;
           COUNT++;
       }
       
       var _impl = scaffold(id, 
       function onetime(filter) {
           filter.append('feMorphology')
               .attr('operator', 'dilate')
               .attr('in', 'SourceAlpha')
               .attr('result', 'TEMPLATE');

           filter.append('feFlood')
                   .attr('result', 'COLOUR');

           filter.append('feComposite')
               .attr('in', 'COLOUR')
               .attr('in2', 'TEMPLATE')
               .attr('operator', 'in')
               .attr('result', 'TEMPLATE_COLOUR');

           filter.append('feGaussianBlur')
               .attr('result', 'BG');
           
           var merge = filter.append('feMerge');
           merge.append('feMergeNode').attr('in', 'BG');
           merge.append('feMergeNode').attr('in', 'SourceGraphic');
       },
       function dynamic(filter) {
           filter
               .attr('x', '-' + padding + '%')
               .attr('y', '-' + padding + '%')
               .attr('width', (2*padding + 100) + '%')
               .attr('height', (2*padding + 100) + '%');
       },
       function transition(filter) {
           filter.select('feMorphology')    
               .attr('radius', morphRadius);

           filter.select('feFlood')    
               .attr('flood-color', color)

           filter.select('feGaussianBlur')
               .attr('stdDeviation', blurRadius);
       });

       
       _impl.morphRadius = function(value) {
           return arguments.length ? (morphRadius = value, _impl) : morphRadius;
       };
       
       _impl.color = function(value) {
           return arguments.length ? (color = value, _impl) : color;
       };
       
       _impl.blurRadius = function(value) {
           return arguments.length ? (blurRadius = value, _impl) : blurRadius;
       };
       
       _impl.padding = function(value) {
           return arguments.length ? (padding = value, _impl) : padding;
       };                  

       return _impl;
   }

   function greyscale(id) { 
       var strength = 1.0;

       if (id == null) {
           id = 'filter-greyscale-' + COUNT;
           COUNT++;
       }

       var _impl = scaffold(id, 
       function onetime(filter) {
           filter.append('feColorMatrix')
                   .attr('type', 'matrix');
       },
       function dynamic() {

       },
       function transition(filter) {
           var s = (1.0 / 3.0);

           var o = s * strength;
           var d = 1.0 - 2*o;

           filter.select('feColorMatrix')
                   .attr('values', d + " " + o + " " + o + " 0 0 " +
                                   o + " " + d + " " + o + " 0 0 " +
                                   o + " " + o + " " + d + " 0 0 " +
                                   "0 0 0 1 0");
       });

       _impl.strength = function(v) { 
           return arguments.length ? (strength = v, _impl) : strength; 
       }

       return _impl;
   }

   function emboss(id) { 
       var color = brand.standard[brand.names.grey],
           blur = 0.6,
           strength = 0.8;

       if (id == null) {
           id = 'filter-emboss-' + COUNT;
           COUNT++;
       }

       var _impl = scaffold(id, 
       function onetime(filter) {
           filter.append('feColorMatrix')
                   .attr('type', 'matrix')
                   .attr('values', "0.3333 0.3333 0.3333 0 0 " +
                                   "0.3333 0.3333 0.3333 0 0 " +
                                   "0.3333 0.3333 0.3333 0 0 " +
                                   "0 0 0 1 0");
           
           var transfer = filter.append('feComponentTransfer');
           [ 'feFuncR', 'feFuncG', 'feFuncB' ].forEach(function (ch) {
               transfer.append(ch)
                       .attr('type', 'discrete')
                       .attr('tableValues', "0.0 0.18 0.75 1.0");
           });
       
           filter.append('feGaussianBlur')
                   .attr('stdDeviation', blur);

           filter.append('feComponentTransfer')
                   .attr('result', 'TRANSFER')
                   .append('feFuncA')
                       .attr('type', 'discrete');

           filter.append('feFlood')
                   .attr('rect', '')
                   .attr('x', '0%')
                   .attr('y', '0%')
                   .attr('width', '100%')
                   .attr('height', '100%')
                   .attr('result', 'FILL');

           filter.append('feBlend')
                   .attr('in', 'TRANSFER')
                   .attr('in2', 'FILL')
                   .attr('mode', 'multiply');
       },
       function dynamic() {

       },
       function transition(filter) {
           filter.select('feFlood').attr('flood-color', color);
           filter.select('feFuncA').attr('tableValues', ("0.0 " + strength));
       });

       _impl.color = function(v) { 
           return arguments.length ? (color = v, _impl) : color; 
       }

       _impl.strength = function(v) { 
           return arguments.length ? (strength = v, _impl) : strength; 
       }

       return _impl;
   }

   var widths = {
       outline: 0.5,
       data: 2.5,
       axis: 1.0,
       grid: 2.0
   }

   // Fallback here chooses system fonts first
   var systemFontFallback = "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"";

   function sizeForWidth(width) {
       if (width < 414) {
           return '12px';
       }
       return '14px';
   }

   var fonts = {
       fixed: {
           cssImport: "@import url(https://fonts.googleapis.com/css?family=Source+Code+Pro:300,500);",
           weightMonochrome: 300,
           weightColor: 500,
           sizeForWidth: sizeForWidth,
           family: "\"Source Code Pro\", Consolas, \"Liberation Mono\", Menlo, Courier, monospace" // Font fallback chosen to keep presentation on places like GitHub where Content Security Policy prevents inline SRC
       },
       variable: {
           cssImport: "@import url(https://fonts.googleapis.com/css?family=Raleway:400,500);",
           weightMonochrome: 400,
           weightColor: 500,
           sizeForWidth: sizeForWidth,
           family: ("\"Raleway\", \"Trebuchet MS\", " + systemFontFallback)
       },
       brand: {
           cssImport: "@import url(https://fonts.googleapis.com/css?family=Electrolize);",
           weightMonochrome: 400,
           weightColor: 400,
           sizeForWidth: sizeForWidth,
           family: ("\"Electrolize\", " + systemFontFallback)
       }
   }

   function svg(id) {
     
     var width = 300,
         height = 150,
         top = 16,
         right = 16,
         bottom = 16,
         left = 16,
         scale = 1,
         inner = 'g.svg-child',
         innerWidth = -1,
         innerHeight = -1,
         style = null,
         background = null,
         title = null,
         desc = null,
         role = 'img',
         classed = 'svg-svg';

     function _updateInnerWidth() {
         innerWidth = width - left - right;
     }    
     
     function _updateInnerHeight() {
         innerHeight = height - top - bottom;
     }   
     
     _updateInnerWidth();
     _updateInnerHeight();
           
     function _impl(context) {
       var selection = context.selection ? context.selection() : context,
           transition = (context.selection !== undefined);

       selection.each(function() {
         var parent = select(this);

         var el = parent.select(_impl.self());
         if (el.empty()) {
           var ariaTitle = (id == null ? '' : id + '-') + 'title';
           var ariaDesc = (id == null ? '' : id + '-') + 'desc';   
           el = parent.append('svg')
                       .attr('version', '1.1')
                       .attr('xmlns', 'http://www.w3.org/2000/svg')
                       .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink') // d3 work around for xlink not required as per D3 4.0
                       .attr('preserveAspectRatio', 'xMidYMid meet')
                       .attr('aria-labelledby', ariaTitle)
                       .attr('aria-describedby', ariaDesc)
                       .attr('id', id);
                       
           el.append('title').attr('id', ariaTitle);        
           el.append('desc').attr('id', ariaDesc);      
           el.append('defs');
           el.append('rect').attr('class', 'background');
           el.append('g').attr('class', 'svg-child');
         }
         
         var defsEl = el.select('defs');
         
         var styleEl = defsEl.selectAll('style').data(style ? [ style ] : []);
         styleEl.exit().remove();
         styleEl = styleEl.enter().append('style').attr('type', 'text/css').merge(styleEl);
         styleEl.text(style);
         
         el.attr('role', role);
         
         el.select('title').text(title);
         el.select('desc').text(desc);
               
         var rect = el.select('rect.background')
                     .attr('width', background != null ? width * scale : null)
                     .attr('height', background != null ? height * scale : null);      
               
         // Never transition
         el.attr('class', classed)

         var g = el.select(_impl.child());
               
         if (transition === true) {
           el = el.transition(context);
           g = g.transition(context);
           rect = rect.transition(context);
         }     

         // Transition if enabled
         el.attr('width', width * scale)
           .attr('height', height * scale)
           .attr('viewBox', '0 0 ' + width + ' ' + height);
       
         g.attr('transform', 'translate(' + left + ',' + top + ')');

         rect.attr('fill', background);

       });
     }

     _impl.self = function() { return 'svg' + (id ?  '#' + id : ''); }
     _impl.child = function() { return inner; }
     _impl.childDefs = function() { return 'defs'; }
     _impl.childWidth = function() { return innerWidth; }
     _impl.childHeight = function() { return innerHeight; }

     _impl.id = function() {
       return id;
     };
       
     _impl.classed = function(value) {
       return arguments.length ? (classed = value, _impl) : classed;
     };

     _impl.style = function(value) {
       return arguments.length ? (style = value, _impl) : style;
     };

     _impl.background = function(value) {
       return arguments.length ? (background = value, _impl) : background;
     };
       
     _impl.width = function(value) {
       if (!arguments.length) return width;
       width = value;
       _updateInnerWidth();
       return _impl;
     };

     _impl.height = function(value) {
       if (!arguments.length) return width;
       height = value;
       _updateInnerHeight();
       return _impl;
     };
     
     _impl.scale = function(value) {
       return arguments.length ? (scale = value, _impl) : scale;
     };

     _impl.title = function(value) {
       return arguments.length ? (title = value, _impl) : title;
     };  

     _impl.desc = function(value) {
       return arguments.length ? (desc = value, _impl) : desc;
     };   
     
     _impl.role = function(value) {
       return arguments.length ? (role = value, _impl) : role;
     };  
      
     _impl.margin = function(value) {
       if (!arguments.length) return {
         top: top,
         right: right,
         bottom: bottom,
         left: left
       };
       if (value.top !== undefined) {
         top = value.top;
         right = value.right;
         bottom = value.bottom;
         left = value.left; 
       } else {
         top = value;
         right = value;
         bottom = value;
         left = value;
       }     
       _updateInnerWidth();
       _updateInnerHeight();
       return _impl;
     };
       
     return _impl;
   }

   var DEFAULT_SIZE = 960;
   var DEFAULT_ASPECT = 1060 / 960;
   var DEFAULT_MARGIN = 26;  // white space

   var filtersMap = {
     'shadow': shadow,
     'emboss': emboss,
     'greyscale': greyscale
   }

   function chart(id) {
     var classed = 'chart-treemap',
         theme = 'light',
         background = undefined,
         width = DEFAULT_SIZE,
         height = null,
         margin = DEFAULT_MARGIN,
         style = undefined,
         scale = 1.0,
         fill = null,
         appendText = null,
         textValue = null,
         appendImage = null,
         imageLink = null,
         imageFallbackLink = null,
         filter = null;

      function _makeFillFn(onlyArray) {
       var colors_array = [];
       if(fill == null){
         colors_array = presentation10.lighter
       }else if (Array.isArray(fill)){
         colors_array = fill
       }else{
         colors_array.push(fill)
       }

       var t = ordinal(colors_array)
       var colors_fn = function (d) { return t(d); };
       if(typeof fill === 'function'){
         colors_fn = fill;
       }
       return onlyArray ? colors_array : colors_fn
      }

     function checkImage(imageSrc, good, bad) {
       var img = new Image();
       img.onload = good;
       img.onerror = bad;
       img.src = imageSrc;
     }

     function _impl(context) {
       var selection = context.selection ? context.selection() : context,
           transition = (context.selection !== undefined);

       var _background = background;
       if (_background === undefined) {
         _background = display[theme].background;
       }
         
       selection.each(function() {
         var node = select(this);
         var sh = height || Math.round(width * DEFAULT_ASPECT);
         
         // SVG element
         var sid = null;
         if (id) sid = 'svg-' + id;
         var root = svg(sid).width(width).height(sh).margin(margin).scale(scale).background(_background);
         var tnode = node;
         if (transition === true) {
           tnode = node.transition(context);
         }
         tnode.call(root);
         
         var snode = node.select(root.self());
         var rootG = snode.select(root.child());

         var g = rootG.select(_impl.self());
         if (g.empty()) {
           g = rootG.append('g').attr('class', classed).attr('id', id);
         }

         var data = g.datum() || [];
         
         var _w = width - 2*margin
         var _h = sh - 2*margin
         var treeMap = treemap()
         .size([_w, _h])
         .round(true);

         var hr = hierarchy(data)
           .sum(function (d) { return d.v; })

         treeMap(hr);


         var colors = _makeFillFn();
         // let w = this._div.node().offsetWidth;
         // let h = select('#home').node().offsetHeight;

         var ff = function (d) { return d.children ? _background : colors(d.data.l); }

         var nodes = g.selectAll('g.node').data(hr.leaves(), function (d) { return d.data.l; })
         var nodesExit = nodes.exit()

         var nodesEntering = nodes.enter()
           .append('g')
             .attr('class', 'node')
             .attr('id', function (d) { return d.data.l; })
             .attr('transform', function (d) { return ("translate(" + (d.x0) + "," + (d.y0) + ")"); })
         
         nodesEntering.append('rect')

         if(appendText){
           nodesEntering.append('text')
              .attr('class', 'node-text')
         }

         var _imageId = function (d,i) { return ("image-" + i + "-" + (d.data.l ? d.data.l.slice(0,1) : '')); }
         if(appendImage){
           nodesEntering.append('image')
             .attr('id', _imageId)
         }

         var nodesEU = nodesEntering.merge(nodes)

       
         if(transition){
           nodesEU = nodesEU.transition(context)
           nodesExit = nodesExit.transition(context)
         }

         nodesEU.attr('transform', function (d) { return ("translate(" + (d.x0) + "," + (d.y0) + ")"); })
         nodesExit.select('rect')
           .attr('x', function (d) { return d.x1; })
           .attr('y', function (d) { return d.y1; })
           .attr('width', function (d) { return d.x0; })
           .attr('height', function (d){ return d.y0; })

         nodesExit.selectAll('image').attr('xlink:href','')
         nodesExit.remove()

         nodesEU.select('rect')
             .attr('width', function (d) { return d.x1 - d.x0; })
             .attr('height', function (d) { return d.y1 - d.y0; })
             .attr('fill', ff)

         if(appendText){
           var _text = function () { return textValue; }
           if(textValue === null){
             _text = function (d) { return d.data.v; }
           } 
           nodesEU.select('text')
               .attr('transform', function (d) { return ("translate(" + ((d.x1-d.x0)/2) + "," + ((d.y1-d.y0)/2) + ")"); })
               .style('font-size', function (d) {
                 var _w = d.x1-d.x0
                 return (_w < 5 ? '10' : _w < 20 ? '15' : '20' ) + 'px'
               })
               .text(_text)
         }

         if(appendImage){
           var _link = function () { return imageLink; }
           if(imageLink === null){
             _link = function (d) { return d.data.u; }
           }
           // doing some calculations to better position the image
           var _maxSize = 400;
           var w = function (d) { return d.x1 - d.x0; }
           var h = function (d) { return d.y1 - d.y0; }
           var _imgD = function (d) {
             var i=0
             var r = _maxSize
             var c = Math.min(w(d), h(d))
             while(r >= c){
               r = _maxSize/Math.pow(2,i)
               i++
             } 
             return r;
           }

           var _filterLookupFn = function (){};
           if(filter && filtersMap.hasOwnProperty(filter)){
             var createFilter = function (c) {
               var fid = "filter-" + filter;
               if (id) fid = fid + "-" + id + "-" + (c ? c.slice(1) : '');
               var e = filtersMap[filter](fid).strength(1.0)
               if(c){
                 e.color(c)
               }
               return e;
             }
             if(filter === 'emboss'){
               // generate filters for all the colours
               var filterLookup = {}
               var filtersForColors = _makeFillFn(true).map(function (c) {
                 var f = createFilter(c)
                 filterLookup[c] = f.url();
                 return f;
               })
               _filterLookupFn = function (d) { return filterLookup[colors(d.data.l)]; }
               filtersForColors.forEach(function (f) { return snode.call(f); })
             }else{
               var f = createFilter();
               _filterLookupFn = function () { return f.url(); }
               snode.call(f)
             }
           }
           var findImageFn = function (d,i) {
             if(!_link(d)){
               return '';
             }
             if(imageFallbackLink){
               checkImage(
                 _link(d), 
                 function (){
                   g.select(("image#" + (_imageId(d,i)))).attr('xlink:href', _link(d))
                 },
                 function (){
                   g.select(("image#" + (_imageId(d,i)))).attr('xlink:href', imageFallbackLink)
                 })
             }
             return _link(d)
           } 
           nodesEU.select('image')
               .attr('x', function (d) { return Math.round(w(d)/2 - _imgD(d)/2); })
               .attr('y', function (d) { return Math.round(h(d)/2 - _imgD(d)/2); })
               .attr('width', _imgD)
               .attr('height', _imgD)
               .attr('filter', _filterLookupFn)
               .attr('xlink:href', findImageFn)

           nodesEU.on('end', findImageFn)
         }

         var _style = style;
         if (_style == null) {
           _style = _impl.defaultStyle();
         }

         var defsEl = snode.select('defs');
         var styleEl = defsEl.selectAll('style').data(_style ? [ _style ] : []);
         styleEl.exit().remove();
         styleEl = styleEl.enter().append('style').attr('type', 'text/css').merge(styleEl);
         styleEl.text(_style);
       })
     }

     _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); };

     _impl.id = function() { return id; };

     _impl.defaultStyle = function () { return ("\n                  " + (fonts.variable.cssImport) + "\n                  " + (fonts.fixed.cssImport) + "  \n\n                  " + (_impl.self()) + " text { \n                                        font-family: " + (fonts.fixed.family) + ";\n                                        font-size: " + (fonts.fixed.sizeForWidth(width)) + ";\n                                        font-weight: " + (fonts.fixed.weightMonochrome) + "; \n                                        fill: " + (display[theme].text) + "; \n                                      }\n                  " + (_impl.self()) + " .node-text { \n                                        text-anchor: middle;\n                                      }\n                  " + (_impl.self()) + " .node {\n                                        stroke: " + (display[theme].background) + ";\n                                        stroke-width: " + (widths.grid) + ";\n                  }\n                "); };

     _impl.classed = function(_) {
       return arguments.length ? (classed = _, _impl) : classed;
     };

     _impl.background = function(_) {
       return arguments.length ? (background = _, _impl) : background;
     };

     _impl.width = function(_) {
       return arguments.length ? (width = _, _impl) : width;
     };

     _impl.height = function(_) {
       return arguments.length ? (height = _, _impl) : height;
     }; 

     _impl.scale = function(_) {
       return arguments.length ? (scale = _, _impl) : scale;
     }; 

     _impl.margin = function(_) {
       return arguments.length ? (margin = _, _impl) : margin;
     };

     _impl.theme = function(_) {
       return arguments.length ? (theme = _, _impl) : theme;
     };

     _impl.fill = function(_) {
       return arguments.length ? (fill = _, _impl) : fill;
     };

     _impl.appendText = function(_) {
       return arguments.length ? (appendText = _, _impl) : appendText;
     };

     _impl.textValue = function(_) {
       return arguments.length ? (textValue = _, _impl) : textValue;
     };

     _impl.appendImage = function(_) {
       return arguments.length ? (appendImage = _, _impl) : appendImage;
     };

     _impl.imageLink = function(_) {
       return arguments.length ? (imageLink = _, _impl) : imageLink;
     };

     _impl.imageFallbackLink = function(_) {
       return arguments.length ? (imageFallbackLink = _, _impl) : imageFallbackLink;
     };

     _impl.filter = function(_) {
       return arguments.length ? (filter = _, _impl) : filter;
     };

     return _impl;
   }

   var SummaryView = (function (SiftView) {
     function SummaryView() {
       // You have to call the super() method to initialize the base class.
       SiftView.call(this);

       // Stores the currently displayed data so view can be reflown during transitions
       this._div = '#treemap';
       this._treemap = chart('pixel-tracker')
         .appendImage(true)
         .imageFallbackLink('assets/fa-eye@3x.png')
         .filter('emboss')
       this.firstTime = true;


       // Subscribe to 'calendarupdated' updates from the Controller
       this.controller.subscribe('graph', this.onGraphUpdated.bind(this));


       // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad) and when it is
       // resizing (onResize).
       // this.registerOnLoadHandler(this.onLoad.bind(this));
       // this.registerOnResizeHandler(this.onResize.bind(this));
     }

     if ( SiftView ) SummaryView.__proto__ = SiftView;
     SummaryView.prototype = Object.create( SiftView && SiftView.prototype );
     SummaryView.prototype.constructor = SummaryView;

     SummaryView.prototype._updateGraph = function _updateGraph (data){
       console.log('updating graph')
       // console.log('updateGraph:', data);

       // let getLabel = d => {
       //   return d.data.name === 'no-trackers-found' || d.children
       //   ? null
       //   : d.data.name + (d.data.count ? ' (' + d.data.count + ')' : '')
       // };

    
       var w = select(this._div).node().offsetWidth;
       var h = select('#home').node().offsetHeight;

       var container = select(this._div).datum(data)
       if(this.firstTime){
         this.firstTime = false;
         container.call(this._treemap.width(w).height(h));
       }else{
         container.transition()
           .delay(data.children.length / 10 * 800)
           .duration(750)
           .call(this._treemap.width(w).height(h))
       }

     };

     SummaryView.prototype.onGraphUpdated = function onGraphUpdated (g){
       console.log('sift-pixel-tracker: onGraphUpdated', g);
       this._updateGraph(g);
     };

     SummaryView.prototype.presentView = function presentView (value){
       console.log('sift-pixel-tracker: presentView: ');
       this._updateGraph(value.data.graph);
     };
     SummaryView.prototype.willPresentView = function willPresentView (value){
       console.log('sift-pixel-tracker: willPresentView: ', value);
     };

     return SummaryView;
   }(SiftView));

   registerSiftView(new SummaryView(window));

   return SummaryView;

}));