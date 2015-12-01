import {Injectable} from 'angular2/core';

@Injectable()
export class UrlUtil {
    setSearchParam(key: string, value: any, reload: boolean) {
        var urlWithoutSearch = window.location.protocol + "//" + window.location.host + window.location.pathname;

        var searchObj = this.searchStrToObj(window.location.search);

        if (value === null || value === undefined) {
            delete searchObj[key];
        } else {
            searchObj[key] = value;
        }

        var url = urlWithoutSearch + this.searchObjToStr(searchObj);

        if (reload) {
            window.location.href = url;
        } else {
            if (history.pushState) {
                window.history.pushState({path: url}, '', url);
            } else {
                console.error('cannot set search param without reloading the page in a browser that does not support history.pushState()');
                window.location.href = url;
            }
        }
    }

    getSearchParams(): {[param: string]: any} {
        return this.searchStrToObj(window.location.search);
    }

    private searchStrToObj(searchStr) {
        searchStr = decodeURIComponent(searchStr);

        var searchObj = {};

        if (searchStr) {
            if (searchStr.indexOf('?') === 0) {
                searchStr = searchStr.substring(1);
            }


            searchStr
                .split('&')
                .forEach((term) => {
                    var [key, value] = term.split('=');

                    //If the parameter is an array
                    if (value &&
                        value.indexOf('[') === 0 &&
                        value.lastIndexOf(']') === value.length - 1) {
                        //Convert the string into an array
                        value = value
                            .substr(1, value.length - 2)
                            .split(',');

                        //The string "[]" with get converted into [""] but it should just be []
                        if (value.length === 1 && value[0] === '') {
                            value = [];
                        }
                    }

                    searchObj[key] = value || '';
                });

        }

        return searchObj;
    }

    private searchObjToStr(searchObj) {
        var searchStr = '';

        for (var key in searchObj) {
            if (searchObj.hasOwnProperty(key)) {
                var value = searchObj[key];

                var safeKey = encodeURIComponent(key);
                var safeValue;
                if (this.isArray(value)) {
                    var valueStr = value.map(item => encodeURIComponent(item)).join(',');
                    safeValue = `[${valueStr}]`;
                } else {
                    safeValue = encodeURIComponent(value);
                }

                if(searchStr !== '') {
                    searchStr += '&';
                }

                searchStr += `${safeKey}=${safeValue}`;
            }
        }

        searchStr && (searchStr = `?${searchStr}`);

        return searchStr;

    }

    private isArray(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]';
    }
}