const original = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = function(arg) {
  // Block scrollIntoView for the problematic element
  if (this.id === 'intoView') {
    return;
  }
  return original.call(this, arg);
};