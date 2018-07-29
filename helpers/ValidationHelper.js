const regex = {
	email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
}
const passFormat = 'a minimum of eight characters, at least one letter, and at least one number.';

module.exports.regex = regex;
module.exports.passFormat = passFormat;

module.exports.isSet = (val) => {
	if(val == undefined) return false;
	if( val.split(' ').join('') == '' ) return false;
	return true;
}

module.exports.isSetAndNotEmpty = (param) => {
	if(param === undefined) return false;
	if(param === null) return false; 
	if(param.toString().replace(/\s+/g, '') == '') return false;
	return true;
}

module.exports.isEmpty = (obj) => {
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) return false;
    }
    return true;
}

module.exports.isNonEmptyObj = (param) => {
	if(typeof param === 'object' && !isEmpty(param)) return true;
	return false;
}

module.exports.someFieldsAreEmpty = (values) => {
	for( k of Object.keys(values) ) { 
		if( !isSet(values[k]) ) return true 
	}
	return false;
}

module.exports.stringLengthBetween = (val, min, max) => {
	return (min <= val.length && max >= val.length);
}

module.exports.areEqual = (val1, val2) => {
	return (val1 === val2);
}

module.exports.isValidEmail = (val) => {
	return regex.email.test( String(val).toLowerCase() );
}

/* Minimum eight characters, at least one letter and one number */
module.exports.isValidPassword = (val) => {
	return regex.password.test( String(val) );
}