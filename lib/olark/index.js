
/**
 * Module dependencies.
 */

var integration = require('analytics.js-integration');
var https = require('use-https');
var tick = require('next-tick');

/**
 * Expose `Olark` integration.
 */

var Olark = module.exports = integration('Olark')
  .assumesPageview()
  .global('olark')
  .option('identify', true)
  .option('page', true)
  .option('siteId', '')
  .option('groupId', '')
  .option('track', false);

/**
 * Initialize.
 *
 * http://www.olark.com/documentation
 * https://www.olark.com/documentation/javascript/api.chat.setOperatorGroup
 *
 * @param {Facade} page
 */

Olark.prototype.initialize = function(page){
  var self = this;
  this.load(function(){
    tick(self.ready);
  });

  // assign chat to a specific site
  var groupId = this.options.groupId;
  if (groupId) api('chat.setOperatorGroup', { group: groupId });

  // keep track of the widget's open state
  api('box.onExpand', function(){ self._open = true; });
  api('box.onShrink', function(){ self._open = false; });
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

Olark.prototype.loaded = function(){
  return !! window.olark;
};

/**
 * Load.
 *
 * @param {Function} callback
 */

Olark.prototype.load = function(callback){
  var el = document.getElementById('olark');
  window.olark||(function(c){var f=window,d=document,l=https()?"https:":"http:",z=c.name,r="load";var nt=function(){f[z]=function(){(a.s=a.s||[]).push(arguments)};var a=f[z]._={},q=c.methods.length;while (q--) {(function(n){f[z][n]=function(){f[z]("call",n,arguments)}})(c.methods[q])}a.l=c.loader;a.i=nt;a.p={ 0:+new Date() };a.P=function(u){a.p[u]=new Date()-a.p[0]};function s(){a.P(r);f[z](r)}f.addEventListener?f.addEventListener(r,s,false):f.attachEvent("on"+r,s);var ld=function(){function p(hd){hd="head";return ["<",hd,"></",hd,"><",i,' onl' + 'oad="var d=',g,";d.getElementsByTagName('head')[0].",j,"(d.",h,"('script')).",k,"='",l,"//",a.l,"'",'"',"></",i,">"].join("")}var i="body",m=d[i];if (!m) {return setTimeout(ld,100)}a.P(1);var j="appendChild",h="createElement",k="src",n=d[h]("div"),v=n[j](d[h](z)),b=d[h]("iframe"),g="document",e="domain",o;n.style.display="none";m.insertBefore(n,m.firstChild).id=z;b.frameBorder="0";b.id=z+"-loader";if (/MSIE[ ]+6/.test(navigator.userAgent)) {b.src="javascript:false"}b.allowTransparency="true";v[j](b);try {b.contentWindow[g].open()}catch (w) {c[e]=d[e];o="javascript:var d="+g+".open();d.domain='"+d.domain+"';";b[k]=o+"void(0);"}try {var t=b.contentWindow[g];t.write(p());t.close()}catch (x) {b[k]=o+'d.write("'+p().replace(/"/g,String.fromCharCode(92)+'"')+'");d.close();'}a.P(2)};ld()};nt()})({ loader: "static.olark.com/jsclient/loader0.js", name:"olark", methods:["configure","extend","declare","identify"] });
  window.olark.identify(this.options.siteId);
  callback();
};

/**
 * Page.
 *
 * @param {Facade} page
 */

Olark.prototype.page = function(page){
  if (!this.options.page) return;
  var props = page.properties();
  var name = page.fullName();
  if (!name && !props.url) return;

  name = name ? name + ' page' : props.url;
  this.notify('looking at ' + name);
};

/**
 * Identify.
 *
 * @param {Facade} identify
 */

Olark.prototype.identify = function(identify){
  if (!this.options.identify) return;

  var username = identify.username();
  var traits = identify.traits();
  var id = identify.userId();
  var email = identify.email();
  var phone = identify.phone();
  var name = identify.name() || identify.firstName();

  if (traits) api('visitor.updateCustomFields', traits);
  if (email) api('visitor.updateEmailAddress', { emailAddress: email });
  if (phone) api('visitor.updatePhoneNumber', { phoneNumber: phone });
  if (name) api('visitor.updateFullName', { fullName: name });

  // figure out best nickname
  var nickname = name || email || username || id;
  if (name && email) nickname += ' (' + email + ')';
  if (nickname) api('chat.updateVisitorNickname', { snippet: nickname });
};

/**
 * Track.
 *
 * @param {Facade} track
 */

Olark.prototype.track = function(track){
  if (!this.options.track) return;
  this.notify('visitor triggered "' + track.event() + '"');
};

/**
 * Send a notification `message` to the operator, only when a chat is active and
 * when the chat is open.
 *
 * @param {String} message
 */

Olark.prototype.notify = function(message){
  if (!this._open) return;

  // lowercase since olark does
  message = message.toLowerCase();

  api('visitor.getDetails', function(data){
    if (!data || !data.isConversing) return;
    api('chat.sendNotificationToOperator', { body: message });
  });
};

/**
 * Helper for Olark API calls.
 *
 * @param {String} action
 * @param {Object} value
 */

function api(action, value) {
  window.olark('api.' + action, value);
}
