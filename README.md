# i18n-express
[![Build Status](https://img.shields.io/travis/koalazak/i18n-express.svg)](https://travis-ci.org/koalazak/i18n-express)
[![npm version](https://badge.fury.io/js/i18n-express.svg)](http://badge.fury.io/js/i18n-express)
[![npm dependency status](https://david-dm.org/koalazak/i18n-express.png)](https://david-dm.org/koalazak/i18n-express)


A simple i18n middleware for Express.js
This module just reads all the <lang>.json files in a directory. Then calculates the user lang and exposes "texts" variables in your views with the texts in that json. 

By default, the user will see the site in the language set by the `cookieLangName` session. If the session is not set, the language set by the browser will be used.

If the user wants to set the language to spanish for example, he would have to visit *http://site.com/?clang=es* (clang is defined at `paramLangName`).

This can be done by using a html 'select' or any other means you want. Once that is done, the `cookieLangName` session will be updated with the new language and the user will forever see the site in the new language until he decides to set a new language again. 

NOTE: When using this module, we recommend also using the [geolang-express](https://github.com/koalazak/geolang-express) module, which sets the `cookieLangName` session to a language based on the visit IP address. 


## Requirements

  - Node >= 0.12
  - Express.js

## Instalation

```bash
$ npm install i18n-express
```

## Usage

```js
var i18n=require("i18n-express");

// old version
app.use( i18n(options) ); 

// new version
app.use( i18n.init(options) ); 

```

## Options

- `translationsPath` : *(default: `i18n`)* The path where you store translations json files.
- `translationsPaths` : *(default: [])* The paths where you store translations json files. But obj model is i18n.translationsPathModel that has two properties. These names are 'area' and 'translationsPath'. translationsPath is same `translationsPath` option but area is different en files to json as {area1: /folder1/en.json, area2: /folder2/en.json}
- `cookieLangName` : *(default: `ulang`)* If you provide a cookie name, try to get user lang from this cookie.
- `browserEnable` : *(default: `true`)* If enabled, try to get user lang from browser headers.
- `defaultLang` :  *(default: `en`)* If all others methods fail, use this lang.
- `paramLangName` :  *(default: `clang`)* Get param to change user lang. ej: visiting 'example.com?clang=es' the lang switchs to 'es'
- `siteLangs` :  *(default: `['en']`)* Array of supported langs. (posbile values for clang and json files)


## Example


 Create a directory "i18n" with .json files for each lang. Ej:
 - en.json
 - es.json
 - en\-us.json
 
 With translations like this (en.json):

 ```json
 {
 "WELCOME_MSG": "Hi! Welcome!",
 "CONTACT_TEXT": "More bla"
 }
 ```
 

 In your Express app.js:

```javascript
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var i18n=require("i18n-express"); // <-- require the module

var indexRoutes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

// old version
//app.use(i18n({
//  translationsPath: path.join(__dirname, 'i18n'), // <--- use here. Specify translations files path.
//  siteLangs: ["en","es"]
//}));

// new version
app.use(i18n.init({
  translationsPath: path.join(__dirname, 'i18n'), // <--- use here. Specify translations files path.
  siteLangs: ["en","es"]
}));

//or
// new version with translationsPaths option 
//app.use(i18n({
//  translationsPaths: [new i18n.translationsPathModel({ area: 'test', translationsPath: path.join(__dirname, 'i18n'))], // <--- use here. Specify translations files path.
//  siteLangs: ["en","es"]
//}));
...

app.use('/', indexRoutes);

module.exports = app;

...

```

Now in your ejs view you have `texts` object and `lang` variable with the active language:

```html
<div>
  Choose your language:
  <ul>
    <li><a class="<%=(lang=="es"?"active":"")%>" href="/?clang=es">Spanish</a></li>
    <li><a class="<%=(lang=="en"?"active":"")%>" href="/?clang=en">English</a></li>
  </ul> 

	<p><%=texts.WELCOME_MSG%></p>
	
	if use translationsPaths option
	<p><%=texts.area(you have written).WELCOME_MSG%></p>
  
</div>
```

Or in your handlebars view:

```html
<div>
  Choose your language:
  <ul>
    <li><a href="/?clang=es">Spanish</a></li>
    <li><a href="/?clang=en">English</a></li>
  </ul> 

	<p>{{texts.WELCOME_MSG}}</p>
	
	if use translationsPaths option
	<p>{{texts.area(you have written).WELCOME_MSG}}</p>
	
</div>
```

## License

MIT

## Author

  - [Facu ZAK](https://github.com/koalazak) 
