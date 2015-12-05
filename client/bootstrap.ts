//For some reason adding in this import stops TypeScript form from complaining about missing ES6 types. e.g. Promise, Map, etc.
import {ROUTER_PROVIDERS} from 'angular2/router';

import {bootstrap} from 'angular2/platform/browser';
import {App} from "./components/app/app";
import {UrlUtil} from './services/urlUtil';

bootstrap(App);