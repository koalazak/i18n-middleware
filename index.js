var fs = require('fs');

function model(obj) {
    this.translationsPathModel = obj.translationsPathModel;
    this.init = obj.init;
}

function getLangFromHeaders(req) {

    var languagesRaw = req.headers['accept-language'] || 'NONE';
    var lparts = languagesRaw.split(',');
    var languages = [];

    for (var x = 0; x < lparts.length; x++) {

        var unLangParts = lparts[x].split(';');
        languages.push(unLangParts[0]);

    }

    return languages;

}

function getLangFromCookie(req, cookieName) {

    if (cookieName && req.session && req.session[cookieName]) {
        return req.session[cookieName];
    } else {
        if (cookieName in req.cookies) {
            return req.cookies[cookieName].toString();
        } else {
            return '';
        }
    }
}

function loadLangJSONFiles(langPath, defaultLang) {

    var i18n = [];
    i18n[defaultLang] = [];

    var files = fs.readdirSync(langPath);

    if (files) {
        for (var i = 0; i < files.length; i++) {
            if (files[i].split('.').pop() === 'json' && files[i].substr(0, 1) !== '.') {
                if (files[i].split('.').shift()) {

                    try {
                        delete require.cache[require.resolve(langPath + '/' + files[i])];
                    } catch (e) { }

                    i18n[files[i].split('.').shift().toLowerCase()] = require(langPath + '/' + files[i]);
                }
            }
        }
    } else {
        console.log('[i18n] No files in ' + langPath);
    }

    return i18n;

}

function translationsPathModel(obj) {
    this.area = obj.area || null;
    this.translationsPath = obj.translationsPath || null;
}


exports = module.exports = new model({
    translationsPathModel: translationsPathModel,
    init: function (opts) {

        var i18nTranslations = [];

        var translationsPath = opts.translationsPath || 'i18n';
        var translationsPaths = opts.translationsPaths || [];
        var cookieLangName = opts.cookieLangName || 'ulang';
        var browserEnable = opts.browserEnable !== false;
        var defaultLang = opts.defaultLang || 'en';
        var paramLangName = opts.paramLangName || 'clang';
        var siteLangs = opts.siteLangs || ['en'];

        if (siteLangs.constructor !== Array) {
            throw new Error('siteLangs must be an Array with supported langs.');
        }

        var computedLang = '';

        function watchTranslationsPath(translationsPath) {
            fs.watch(translationsPath, function (event, filename) {
                if (filename) {
                    try {
                        i18nTranslations = loadLangJSONFiles(translationsPath, defaultLang);
                    } catch (ee) {
                        //Some editors first empty the file and then save the content. This generate a "Unexpected end of input" error
                    }
                }
            });
            return loadLangJSONFiles(translationsPath, defaultLang);
        }

        if (translationsPaths.length == 0) {
            i18nTranslations = watchTranslationsPath(translationsPath);
        }
        else {
            translationsPaths.forEach(function (model) {
                model = new translationsPathModel(model);
                if (model.translationsPath && model.area) {
                    var langArry = watchTranslationsPath(model.translationsPath);
                    for (var p in langArry) {
                        if (i18nTranslations[p] === undefined)
                            i18nTranslations[p] = {};
                        i18nTranslations[p][model.area] = langArry[p];
                    }
                }
            });
        }

        return function i18n(req, res, next) {

            var alreadyTryCookie = false;
            var alreadyBrowser = false;

            //User is setting a lang via get param. Store and use it.
            if (paramLangName in req.query) {
                if (siteLangs.indexOf(req.query[paramLangName]) > -1) {
                    if (cookieLangName && req.session) {
                        req.session[cookieLangName] = req.query[paramLangName].toString();
                    }
                    computedLang = req.query[paramLangName].toString();
                }
            }

            while (computedLang === '') {

                if (cookieLangName && alreadyTryCookie === false) {
                    var cLang = getLangFromCookie(req, cookieLangName);
                    if (cLang) {
                        computedLang = cLang;
                        break;
                    } else {
                        alreadyTryCookie = true;
                        continue;
                    }

                } else if (browserEnable && alreadyBrowser === false) {
                    var wLang = getLangFromHeaders(req);

                    if (wLang.length) {
                        computedLang = wLang[0];
                        break;
                    } else {
                        alreadyBrowser = true;
                        continue;
                    }

                } else {
                    computedLang = defaultLang;
                }

            }

            function setDefaulti18n() {
                req.app.locals.texts = i18nTranslations[defaultLang];
                req.app.locals.lang = defaultLang;
            }

            computedLang = computedLang.toLowerCase();

            //setting texts to views

            if (computedLang in i18nTranslations) {
                req.app.locals.texts = i18nTranslations[computedLang];
                req.app.locals.lang = computedLang;
            } else {
                if (computedLang.indexOf('-') > -1) {
                    //try extract "en" from "en-US"
                    var soloLang = computedLang.split('-')[0];
                    if (soloLang in i18nTranslations) {
                        req.app.locals.texts = i18nTranslations[soloLang];
                        req.app.locals.lang = soloLang;
                    } else {
                        setDefaulti18n();
                    }
                } else {
                    setDefaulti18n();
                }
            }

            //req.i18n_all_texts=i18nTranslations;
            req.i18n_texts = req.app.locals.texts;
            req.i18n_lang = req.app.locals.lang;

            next();

        };

    }
});
