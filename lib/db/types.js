const $uid = function $uid() {
    this.type = $uid
    this.options = ['type','required','uidLength','minLength']
}

const $incr = function $incr() {
    this.type = $incr
    this.options = ['type','required','idCount','idMaxCount']
}

const Any = function Any() {
    this.type = Any
    this.options = ['type','anyOf','default','validate']
}

module.exports = {
    $uid,
    $incr,
    Any
}