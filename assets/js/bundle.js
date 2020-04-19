(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict'
jQuery(function($) {

    window.form_adjuster = {
        init: function(options) {
            this.options = options;
            this.init_cache();
            this.init_validation();
            this.init_mask();

            if (this.options['file']) {
                this.build_file_structure();
                this.check_file();
                this.input_file_reset();
            }

            this.send_validation();
            this.init_btn_no_ajax();
            this.init_ajax_without_form();
            this.number_only_init();
        },

        init_options: function() {
            var default_handler_url = window.wp_data ? window.wp_data : false,
                default_settings = {
                    'type': 'POST',
                    'handler': default_handler_url.sau_sender_ajax_url ? default_handler_url.sau_sender_ajax_url : './form-handler.php',
                    'dataType': 'json',
                    'contentType': false,
                    'processData': false,
                    'task':'task',

                    //file
                    'file': false, //not finished yet
                    //callbacks for file
                    'onload': false,
                    //classes for input type file
                    //.js-file-preview - for preview

                    //callbacks success,error for ajax
                    'success': false,
                    'error': false
                };
            return this.options ? $.extend(default_settings, this.options) : default_settings
        },

        init_cache: function(options) {
            this.options = this.init_options();
            this.$input_phone = $('.userphone');
            this.$input_date = $('.js-input-date');
            this.$form = $('form:not(.js-no-ajax)');
            this.$noajax_btn = $('.js-noajax-btn');
            this.$number_only = $('.js-number-only');

            //file
            this.$file_input = $('.js-file-check');

            //ajax without form
            //parameters: data-json="{'action':'foo','parameters':'bar'}"
            this.$btn_without_form = $('.js-single-button');
        },

        init_validation: function() {
            $.validator.addMethod(
                'regexp',
                function(value, element, regexp) {
                    var re = new RegExp(regexp);
                    return this.optional(element) || re.test(value);
                },
                "Please check your input."
            );

            $.validator.addClassRules({
                userphone: {
                    regexp: '[^_]+$'
                },
                usermail: {
                    email: true,
                    required: true
                },
                required: {
                    required: true
                },
                // select: {
                //     required: true
                // },
                password:{
                    minlength:6
                },
                passwordConfirm:{
                    minlength:6,
                    equalTo:'.js-input-new-password'
                }

            });
        },

        init_mask: function() {
            this.$input_phone.inputmask({ "mask": "+7(999)999-99-99",showMaskOnHover: false });
            this.$input_date.inputmask("dd/mm/yyyy",{showMaskOnHover: false });
        },

        form_send: function(formObject, action) {
            var settings = form_adjuster.options;

            $.ajax({
                type: settings['type'],
                url: settings['handler'],
                dataType: settings['dataType'],
                contentType: settings['contentType'],
                processData: settings['processData'],
                data: formObject,
                success: function() {
                    if (settings['success']) {
                        settings['success']();
                    } else {
                        form_adjuster.ajax_success();
                    }

                    form_adjuster.$form_cur = false;
                },
                error: function() {
                    if (settings['error']) {
                        settings['error']();
                    } else {
                        form_adjuster.ajax_error();
                    }

                    form_adjuster.$form_cur = false;
                }
            });
        },

        ajax_success: function() {
            console.log('success');

            if (form_adjuster.$form_cur) {
                form_adjuster.$form_cur.trigger('reset');
            }
        },

        ajax_error: function() {
            console.log('error');
        },
        //assembly form with formData
        formData_assembly: function(form) {
            var formSendAll = new FormData(),
                formdata = {},
                form_arr,
                $form = $(form),
                $fields = $form.find(':input,select,textarea'),
                pos_arr = [];

            form_arr = $fields.serializeArray();

            for (var i = 0; i < form_arr.length; i++) {
                if (form_arr[i].value.length > 0) {

                    var $current_input = $fields.filter('[name=' + form_arr[i].name + ']'),
                        value_arr = {};

                    if ($current_input.attr('type') != 'hidden' && !$current_input.hasClass('js-system-field')) {
                        var title = $current_input.attr('data-title');

                        if($current_input.hasClass("js-work-position")){
                            var $input_date = $current_input.closest('.js-add-work-block').find('.js-datepicker-period');

                            pos_arr.push({
                                    'value':form_arr[i].value,
                                    'period':$input_date.val(),
                                    'title':'Данные о месте работы'
                                });
                        }

                        else{
                            if ($form.hasClass('js-only-selected')) {
                                formdata[form_arr[i].value] = $current_input.closest('.js-wrap').find('.js-counter-input').val();
                            } else {
                                value_arr['value'] = form_arr[i].value;
                                value_arr['title'] = title;
                                formdata[form_arr[i].name] = value_arr;
                            }
                        }
                        

                    } else {
                        if(!$current_input.hasClass('js-system-field')){
                            formSendAll.append(form_arr[i].name, form_arr[i].value);
                        }  
                    }
                }
            }
            
            if (pos_arr.length > 0){
                formdata['position'] = pos_arr;
            }
            
            formSendAll.append('formData', JSON.stringify(formdata));

            //file
            if (form_adjuster.options['file']) {
                var $input_file = $(form).find('.js-file-check');

                if ($input_file.length > 0) {
                    $input_file.each(function() {
                        var $input_cur = $(this),
                            val_length = $input_cur.val().length,
                            multy = $input_cur.prop('multiple');

                        if (val_length > 0) {
                            if (!multy) {
                                formSendAll.append($input_cur.attr('name'), $input_cur[0].files[0]);
                            } else {
                                form_adjuster.collect_multiple_file(formSendAll, $input_cur);
                            }
                        }
                    })
                }
            }

            this.form_send(formSendAll, false);
        },

        collect_multiple_file: function(data, $input) {
            var $wrapper = $input.closest('.js-file-wrapper'),
                $list = $wrapper.find('.js-file-list');

            $('.js-file-list li').each(function() {
                var file_name = $(this).attr('data-name');

                for (var i = 0; i < $input[0].files.length; i++) {
                    if (file_name == $input[0].files[i].name) {
                        data.append($input.attr('name'), $input[0].files[i]);
                    }
                }
            })
        },

        //file reader and handlers
        check_file: function() {
            var reader;

            function abortRead() {
                reader.abort();
            }

            function errorHandler(evt) {
                switch (evt.target.error.code) {
                    case evt.target.error.NOT_FOUND_ERR:
                        alert('File Not Found!');
                        break;
                    case evt.target.error.NOT_READABLE_ERR:
                        alert('File is not readable');
                        break;
                    case evt.target.error.ABORT_ERR:
                        break; // noop
                    default:
                        alert('An error occurred reading this file.');
                };
            }

            function handleFileSelect(evt) {
                var $input = $(this);

                for (var i = 0; i < $input[0].files.length; i++) {
                    reader_file($input[0].files[i], $input);
                }
            }

            function reader_file(file, $input) {
                var reader = new FileReader(),
                    file_name = file.name,
                    $wrapper = $input.closest('.js-upload-wrapper'),
                    $name = $wrapper.find('.js-filename'),
                    $block = $input.closest('.js-input-file-block');

                reader.file_name = file_name;
                reader.onerror = errorHandler;

                $block.addClass('_onload');

                reader.onabort = function(e) {
                    alert('File read cancelled');
                };

                reader.onload = function(event) {
                    if (form_adjuster.options['onload']) {
                        form_adjuster.options['onload']();
                    } else {
                        form_adjuster.file_onload($input,reader);
                    }
                };

                reader.onprogress = function(event) {
                    //progress bar
                    if (event.lengthComputable) {
                        var percent = parseInt(((event.loaded / event.total) * 100), 10),
                            $bar = $wrapper.find('.js-upload-progressbar');

                        $bar.css('width', percent + '%');
                    }
                };

                reader.readAsDataURL(file);
            }

            form_adjuster.$file_input.on('change', handleFileSelect);
        },

        file_onload: function($input,reader) {
            if ($input.hasClass('js-file-preview')){
                var $wrapper = $input.closest('.js-file-module'),
                    $img = $wrapper.find('.js-object-fit'),
                    $input_change = $wrapper.find('.js-indicator-changes');
    
                $input_change.attr('value','true');
                $img.attr("src",reader.result);
    
                $.fn.objectFitImages($img);
            }

            else{
                var $wrapper = $input.closest('.js-upload-wrapper'),
                    $label = $wrapper.find('.js-upload-text'),
                    $block = $input.closest('.js-input-file-block');

                $block.removeClass('_onload').addClass('_loaded');
                $wrapper.addClass('_loaded');
                $label.text(reader.file_name);
            }
        },

        build_file_structure: function() {
            form_adjuster.$file_input.each(function() {
                var $input = $(this),
                    params = $input.data('params');
                
                params = params ? params : {};

                $input.wrap('<div class="upload-wrapper js-upload-wrapper' + 
                    (params.mod ? " upload-wrapper_" + params.mod : "") + '"></div>')
                    .after('<div class="upload-wrapper__bar-wrapper"><div class="upload-wrapper__bar js-upload-progressbar"></div></div><span class="upload-wrapper__label"><span class="upload-wrapper__text js-upload-text">' + 
                        (params.label ? params.label : 'Изменить') + '</span>' + 
                        (params.mod === 'simple' ? '<span class="cross-btn js-file-reset"></span>' : '') + '</span>');
            })
        },

        //reset input type file with save all handlers
        input_file_reset: function() {
            $(document).on('click', '.js-file-reset', function() {
                var $btn = $(this);

                if($btn.hasClass('js-reset-preview')){
                    var $wrapper = $btn.closest('.js-file-module'),
                        $input = $wrapper.find('.js-file-check'),
                        $img = $wrapper.find('.js-object-fit'),
                        $input_change = $wrapper.find('.js-indicator-changes');
                    
                    $input_change.attr('value','true');
                    $img.attr('src','').removeAttr('style');
                }

                else{
                    var $wrapper = $btn.closest('.js-upload-wrapper'),
                        $label = $wrapper.find('.js-upload-text'),
                        $input = $wrapper.find('.js-file-check');

                    $wrapper.removeClass('_loaded');
                    $label.text($input.data('params').label);
                }

                $input.replaceWith($input.val('').clone(true));
            });
        },

        //send data without form (add in favorite etc.)
        init_ajax_without_form: function() {
            form_adjuster.$btn_without_form.click(function(e) {
                e.preventDefault();

                var json = JSON.parse($(this).attr('data-json'));

                form_adjuster.form_send(JSON.stringify(json.parameters), json.action);
            });
        },

        //send form without custom ajax
        init_btn_no_ajax: function() {
            form_adjuster.$noajax_btn.click(function(e) {
                e.preventDefault();

                var $form = $(this).closest('form');

                $form.submit();
            })
        },

        //possible enter only number in input
        number_only_init: function() {
            $(document).on('keydown','.js-number-only', function(event) {
                if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 ||
                    (event.keyCode == 65 && event.ctrlKey === true) ||
                    (event.keyCode >= 35 && event.keyCode <= 39)) {
                    return;
                } else {
                    if ((event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
                        event.preventDefault();
                    }
                }
            });
        },

        send_validation: function() {
            this.$form.each(function() {
                $(this).validate({
                    errorPlacement: function(error, element) {
                        error.remove();
                    },
                    submitHandler: function(form) {
                        form_adjuster.$form_cur = $(form);

                        if(!$(form).hasClass('js-custom-ajax')){
                            form_adjuster.formData_assembly(form);
                        }
                        else{
                            $(form).trigger('custom_ajax');
                        }
                    }
                })
            });
        }
    };
});
},{}],2:[function(require,module,exports){
(function (global){
; var __browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
/*! jQuery v2.1.4 | (c) 2005, 2015 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k={},l=a.document,m="2.1.4",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return n.each(this,a,b)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(n.isPlainObject(d)||(e=n.isArray(d)))?(e?(e=!1,f=c&&n.isArray(c)?c:[]):f=c&&n.isPlainObject(c)?c:{},g[b]=n.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){return!n.isArray(a)&&a-parseFloat(a)+1>=0},isPlainObject:function(a){return"object"!==n.type(a)||a.nodeType||n.isWindow(a)?!1:a.constructor&&!j.call(a.constructor.prototype,"isPrototypeOf")?!1:!0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(a){var b,c=eval;a=n.trim(a),a&&(1===a.indexOf("use strict")?(b=l.createElement("script"),b.text=a,l.head.appendChild(b).parentNode.removeChild(b)):c(a))},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=s(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:g.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=s(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(c=a[b],b=a,a=c),n.isFunction(a)?(e=d.call(arguments,2),f=function(){return a.apply(b||this,e.concat(d.call(arguments)))},f.guid=a.guid=a.guid||n.guid++,f):void 0},now:Date.now,support:k}),n.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function s(a){var b="length"in a&&a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ha(),z=ha(),A=ha(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N=M.replace("w","w#"),O="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+N+"))|)"+L+"*\\]",P=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+O+")*)|.*)\\)|)",Q=new RegExp(L+"+","g"),R=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),S=new RegExp("^"+L+"*,"+L+"*"),T=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),U=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),V=new RegExp(P),W=new RegExp("^"+N+"$"),X={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M.replace("w","w*")+")"),ATTR:new RegExp("^"+O),PSEUDO:new RegExp("^"+P),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/^[^{]+\{\s*\[native \w/,_=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,aa=/[+~]/,ba=/'|\\/g,ca=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),da=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},ea=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(fa){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function ga(a,b,d,e){var f,h,j,k,l,o,r,s,w,x;if((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,d=d||[],k=b.nodeType,"string"!=typeof a||!a||1!==k&&9!==k&&11!==k)return d;if(!e&&p){if(11!==k&&(f=_.exec(a)))if(j=f[1]){if(9===k){if(h=b.getElementById(j),!h||!h.parentNode)return d;if(h.id===j)return d.push(h),d}else if(b.ownerDocument&&(h=b.ownerDocument.getElementById(j))&&t(b,h)&&h.id===j)return d.push(h),d}else{if(f[2])return H.apply(d,b.getElementsByTagName(a)),d;if((j=f[3])&&c.getElementsByClassName)return H.apply(d,b.getElementsByClassName(j)),d}if(c.qsa&&(!q||!q.test(a))){if(s=r=u,w=b,x=1!==k&&a,1===k&&"object"!==b.nodeName.toLowerCase()){o=g(a),(r=b.getAttribute("id"))?s=r.replace(ba,"\\$&"):b.setAttribute("id",s),s="[id='"+s+"'] ",l=o.length;while(l--)o[l]=s+ra(o[l]);w=aa.test(a)&&pa(b.parentNode)||b,x=o.join(",")}if(x)try{return H.apply(d,w.querySelectorAll(x)),d}catch(y){}finally{r||b.removeAttribute("id")}}}return i(a.replace(R,"$1"),b,d,e)}function ha(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ia(a){return a[u]=!0,a}function ja(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ka(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function la(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function na(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function oa(a){return ia(function(b){return b=+b,ia(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function pa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=ga.support={},f=ga.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=ga.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=g.documentElement,e=g.defaultView,e&&e!==e.top&&(e.addEventListener?e.addEventListener("unload",ea,!1):e.attachEvent&&e.attachEvent("onunload",ea)),p=!f(g),c.attributes=ja(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ja(function(a){return a.appendChild(g.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=$.test(g.getElementsByClassName),c.getById=ja(function(a){return o.appendChild(a).id=u,!g.getElementsByName||!g.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=$.test(g.querySelectorAll))&&(ja(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\f]' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ja(function(a){var b=g.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=$.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ja(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",P)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=$.test(o.compareDocumentPosition),t=b||$.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===g||a.ownerDocument===v&&t(v,a)?-1:b===g||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,h=[a],i=[b];if(!e||!f)return a===g?-1:b===g?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return la(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)i.unshift(c);while(h[d]===i[d])d++;return d?la(h[d],i[d]):h[d]===v?-1:i[d]===v?1:0},g):n},ga.matches=function(a,b){return ga(a,null,null,b)},ga.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(U,"='$1']"),!(!c.matchesSelector||!p||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return ga(b,n,null,[a]).length>0},ga.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},ga.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ga.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ga.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=ga.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ga.selectors={cacheLength:50,createPseudo:ia,match:X,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ca,da),a[3]=(a[3]||a[4]||a[5]||"").replace(ca,da),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ga.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ga.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return X.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&V.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ca,da).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ga.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(Q," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===w&&j[1],m=j[0]===w&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[w,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===w)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(s&&((l[u]||(l[u]={}))[a]=[w,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ga.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ia(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ia(function(a){var b=[],c=[],d=h(a.replace(R,"$1"));return d[u]?ia(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ia(function(a){return function(b){return ga(a,b).length>0}}),contains:ia(function(a){return a=a.replace(ca,da),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ia(function(a){return W.test(a||"")||ga.error("unsupported lang: "+a),a=a.replace(ca,da).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:oa(function(){return[0]}),last:oa(function(a,b){return[b-1]}),eq:oa(function(a,b,c){return[0>c?c+b:c]}),even:oa(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:oa(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:oa(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:oa(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ma(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=na(b);function qa(){}qa.prototype=d.filters=d.pseudos,d.setFilters=new qa,g=ga.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=S.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=T.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(R," ")}),h=h.slice(c.length));for(g in d.filter)!(e=X[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ga.error(a):z(a,i).slice(0)};function ra(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function sa(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[u]||(b[u]={}),(h=i[d])&&h[0]===w&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function ta(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ua(a,b,c){for(var d=0,e=b.length;e>d;d++)ga(a,b[d],c);return c}function va(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function wa(a,b,c,d,e,f){return d&&!d[u]&&(d=wa(d)),e&&!e[u]&&(e=wa(e,f)),ia(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ua(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:va(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=va(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=va(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function xa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=sa(function(a){return a===b},h,!0),l=sa(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[sa(ta(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return wa(i>1&&ta(m),i>1&&ra(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(R,"$1"),c,e>i&&xa(a.slice(i,e)),f>e&&xa(a=a.slice(e)),f>e&&ra(a))}m.push(c)}return ta(m)}function ya(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,m,o,p=0,q="0",r=f&&[],s=[],t=j,u=f||e&&d.find.TAG("*",k),v=w+=null==t?1:Math.random()||.1,x=u.length;for(k&&(j=g!==n&&g);q!==x&&null!=(l=u[q]);q++){if(e&&l){m=0;while(o=a[m++])if(o(l,g,h)){i.push(l);break}k&&(w=v)}c&&((l=!o&&l)&&p--,f&&r.push(l))}if(p+=q,c&&q!==p){m=0;while(o=b[m++])o(r,s,g,h);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=F.call(i));s=va(s)}H.apply(i,s),k&&!f&&s.length>0&&p+b.length>1&&ga.uniqueSort(i)}return k&&(w=v,j=t),r};return c?ia(f):f}return h=ga.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=xa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,ya(e,d)),f.selector=a}return f},i=ga.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ca,da),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=X.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ca,da),aa.test(j[0].type)&&pa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&ra(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,aa.test(a)&&pa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ja(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ja(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ka("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ja(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ka("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ja(function(a){return null==a.getAttribute("disabled")})||ka(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ga}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=n.expr.match.needsContext,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^.[^:#\[\.,]*$/;function x(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(w.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return g.call(b,a)>=0!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=this.length,d=[],e=this;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;c>b;b++)if(n.contains(e[b],this))return!0}));for(b=0;c>b;b++)n.find(a,e[b],d);return d=this.pushStack(c>1?n.unique(d):d),d.selector=this.selector?this.selector+" "+a:a,d},filter:function(a){return this.pushStack(x(this,a||[],!1))},not:function(a){return this.pushStack(x(this,a||[],!0))},is:function(a){return!!x(this,"string"==typeof a&&u.test(a)?n(a):a||[],!1).length}});var y,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=n.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||y).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:l,!0)),v.test(c[1])&&n.isPlainObject(b))for(c in b)n.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}return d=l.getElementById(c[2]),d&&d.parentNode&&(this.length=1,this[0]=d),this.context=l,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?"undefined"!=typeof y.ready?y.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};A.prototype=n.fn,y=n(l);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};n.extend({dir:function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a)}return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),n.fn.extend({has:function(a){var b=n(a,this),c=b.length;return this.filter(function(){for(var a=0;c>a;a++)if(n.contains(this,b[a]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=u.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.unique(f):f)},index:function(a){return a?"string"==typeof a?g.call(n(a),this[0]):g.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.unique(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){while((a=a[b])&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return n.dir(a,"parentNode")},parentsUntil:function(a,b,c){return n.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return n.dir(a,"nextSibling")},prevAll:function(a){return n.dir(a,"previousSibling")},nextUntil:function(a,b,c){return n.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return n.dir(a,"previousSibling",c)},siblings:function(a){return n.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return n.sibling(a.firstChild)},contents:function(a){return a.contentDocument||n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(C[a]||n.unique(e),B.test(a)&&e.reverse()),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return n.each(a.match(E)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):n.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(b=a.memory&&l,c=!0,g=e||0,e=0,f=h.length,d=!0;h&&f>g;g++)if(h[g].apply(l[0],l[1])===!1&&a.stopOnFalse){b=!1;break}d=!1,h&&(i?i.length&&j(i.shift()):b?h=[]:k.disable())},k={add:function(){if(h){var c=h.length;!function g(b){n.each(b,function(b,c){var d=n.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&g(c)})}(arguments),d?f=h.length:b&&(e=c,j(b))}return this},remove:function(){return h&&n.each(arguments,function(a,b){var c;while((c=n.inArray(b,h,c))>-1)h.splice(c,1),d&&(f>=c&&f--,g>=c&&g--)}),this},has:function(a){return a?n.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],f=0,this},disable:function(){return h=i=b=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,b||k.disable(),this},locked:function(){return!i},fireWith:function(a,b){return!h||c&&!i||(b=b||[],b=[a,b.slice?b.slice():b],d?i.push(b):j(b)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!c}};return k},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&n.isFunction(a.promise)?e:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){(a===!0?--n.readyWait:n.isReady)||(n.isReady=!0,a!==!0&&--n.readyWait>0||(H.resolveWith(l,[n]),n.fn.triggerHandler&&(n(l).triggerHandler("ready"),n(l).off("ready"))))}});function I(){l.removeEventListener("DOMContentLoaded",I,!1),a.removeEventListener("load",I,!1),n.ready()}n.ready.promise=function(b){return H||(H=n.Deferred(),"complete"===l.readyState?setTimeout(n.ready):(l.addEventListener("DOMContentLoaded",I,!1),a.addEventListener("load",I,!1))),H.promise(b)},n.ready.promise();var J=n.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)n.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f};n.acceptData=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function K(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=n.expando+K.uid++}K.uid=1,K.accepts=n.acceptData,K.prototype={key:function(a){if(!K.accepts(a))return 0;var b={},c=a[this.expando];if(!c){c=K.uid++;try{b[this.expando]={value:c},Object.defineProperties(a,b)}catch(d){b[this.expando]=c,n.extend(a,b)}}return this.cache[c]||(this.cache[c]={}),c},set:function(a,b,c){var d,e=this.key(a),f=this.cache[e];if("string"==typeof b)f[b]=c;else if(n.isEmptyObject(f))n.extend(this.cache[e],b);else for(d in b)f[d]=b[d];return f},get:function(a,b){var c=this.cache[this.key(a)];return void 0===b?c:c[b]},access:function(a,b,c){var d;return void 0===b||b&&"string"==typeof b&&void 0===c?(d=this.get(a,b),void 0!==d?d:this.get(a,n.camelCase(b))):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d,e,f=this.key(a),g=this.cache[f];if(void 0===b)this.cache[f]={};else{n.isArray(b)?d=b.concat(b.map(n.camelCase)):(e=n.camelCase(b),b in g?d=[b,e]:(d=e,d=d in g?[d]:d.match(E)||[])),c=d.length;while(c--)delete g[d[c]]}},hasData:function(a){return!n.isEmptyObject(this.cache[a[this.expando]]||{})},discard:function(a){a[this.expando]&&delete this.cache[a[this.expando]]}};var L=new K,M=new K,N=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,O=/([A-Z])/g;function P(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(O,"-$1").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:N.test(c)?n.parseJSON(c):c}catch(e){}M.set(a,b,c)}else c=void 0;return c}n.extend({hasData:function(a){return M.hasData(a)||L.hasData(a)},data:function(a,b,c){
return M.access(a,b,c)},removeData:function(a,b){M.remove(a,b)},_data:function(a,b,c){return L.access(a,b,c)},_removeData:function(a,b){L.remove(a,b)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=M.get(f),1===f.nodeType&&!L.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),P(f,d,e[d])));L.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){M.set(this,a)}):J(this,function(b){var c,d=n.camelCase(a);if(f&&void 0===b){if(c=M.get(f,a),void 0!==c)return c;if(c=M.get(f,d),void 0!==c)return c;if(c=P(f,d,void 0),void 0!==c)return c}else this.each(function(){var c=M.get(this,d);M.set(this,d,b),-1!==a.indexOf("-")&&void 0!==c&&M.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){M.remove(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=L.get(a,b),c&&(!d||n.isArray(c)?d=L.access(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return L.get(a,c)||L.access(a,c,{empty:n.Callbacks("once memory").add(function(){L.remove(a,[b+"queue",c])})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=L.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var Q=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,R=["Top","Right","Bottom","Left"],S=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)},T=/^(?:checkbox|radio)$/i;!function(){var a=l.createDocumentFragment(),b=a.appendChild(l.createElement("div")),c=l.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),k.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",k.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var U="undefined";k.focusinBubbles="onfocusin"in a;var V=/^key/,W=/^(?:mouse|pointer|contextmenu)|click/,X=/^(?:focusinfocus|focusoutblur)$/,Y=/^([^.]*)(?:\.(.+)|)$/;function Z(){return!0}function $(){return!1}function _(){try{return l.activeElement}catch(a){}}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.get(a);if(r){c.handler&&(f=c,c=f.handler,e=f.selector),c.guid||(c.guid=n.guid++),(i=r.events)||(i=r.events={}),(g=r.handle)||(g=r.handle=function(b){return typeof n!==U&&n.event.triggered!==b.type?n.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(E)||[""],j=b.length;while(j--)h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o&&(l=n.event.special[o]||{},o=(e?l.delegateType:l.bindType)||o,l=n.event.special[o]||{},k=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},f),(m=i[o])||(m=i[o]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,p,g)!==!1||a.addEventListener&&a.addEventListener(o,g,!1)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),n.event.global[o]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.hasData(a)&&L.get(a);if(r&&(i=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=i[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&q!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete i[o])}else for(o in i)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(i)&&(delete r.handle,L.remove(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,m,o,p=[d||l],q=j.call(b,"type")?b.type:b,r=j.call(b,"namespace")?b.namespace.split("."):[];if(g=h=d=d||l,3!==d.nodeType&&8!==d.nodeType&&!X.test(q+n.event.triggered)&&(q.indexOf(".")>=0&&(r=q.split("."),q=r.shift(),r.sort()),k=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=r.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:n.makeArray(c,[b]),o=n.event.special[q]||{},e||!o.trigger||o.trigger.apply(d,c)!==!1)){if(!e&&!o.noBubble&&!n.isWindow(d)){for(i=o.delegateType||q,X.test(i+q)||(g=g.parentNode);g;g=g.parentNode)p.push(g),h=g;h===(d.ownerDocument||l)&&p.push(h.defaultView||h.parentWindow||a)}f=0;while((g=p[f++])&&!b.isPropagationStopped())b.type=f>1?i:o.bindType||q,m=(L.get(g,"events")||{})[b.type]&&L.get(g,"handle"),m&&m.apply(g,c),m=k&&g[k],m&&m.apply&&n.acceptData(g)&&(b.result=m.apply(g,c),b.result===!1&&b.preventDefault());return b.type=q,e||b.isDefaultPrevented()||o._default&&o._default.apply(p.pop(),c)!==!1||!n.acceptData(d)||k&&n.isFunction(d[q])&&!n.isWindow(d)&&(h=d[k],h&&(d[k]=null),n.event.triggered=q,d[q](),n.event.triggered=void 0,h&&(d[k]=h)),b.result}},dispatch:function(a){a=n.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(L.get(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(g.namespace))&&(a.handleObj=g,a.data=g.data,e=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(a.result=e)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!==this;i=i.parentNode||this)if(i.disabled!==!0||"click"!==a.type){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>=0:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button;return null==a.pageX&&null!=b.clientX&&(c=a.target.ownerDocument||l,d=c.documentElement,e=c.body,a.pageX=b.clientX+(d&&d.scrollLeft||e&&e.scrollLeft||0)-(d&&d.clientLeft||e&&e.clientLeft||0),a.pageY=b.clientY+(d&&d.scrollTop||e&&e.scrollTop||0)-(d&&d.clientTop||e&&e.clientTop||0)),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},fix:function(a){if(a[n.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=W.test(e)?this.mouseHooks:V.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new n.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=l),3===a.target.nodeType&&(a.target=a.target.parentNode),g.filter?g.filter(a,f):a},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==_()&&this.focus?(this.focus(),!1):void 0},delegateType:"focusin"},blur:{trigger:function(){return this===_()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&n.nodeName(this,"input")?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=n.extend(new n.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?n.event.trigger(e,null,b):n.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},n.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?Z:$):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={isDefaultPrevented:$,isPropagationStopped:$,isImmediatePropagationStopped:$,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=Z,a&&a.preventDefault&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=Z,a&&a.stopPropagation&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=Z,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!n.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),k.focusinBubbles||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a),!0)};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=L.access(d,b);e||d.addEventListener(a,c,!0),L.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=L.access(d,b)-1;e?L.access(d,b,e):(d.removeEventListener(a,c,!0),L.remove(d,b))}}}),n.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(g in a)this.on(g,b,c,a[g],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=$;else if(!d)return this;return 1===e&&(f=d,d=function(a){return n().off(a),f.apply(this,arguments)},d.guid=f.guid||(f.guid=n.guid++)),this.each(function(){n.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=$),this.each(function(){n.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}});var aa=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,ba=/<([\w:]+)/,ca=/<|&#?\w+;/,da=/<(?:script|style|link)/i,ea=/checked\s*(?:[^=]|=\s*.checked.)/i,fa=/^$|\/(?:java|ecma)script/i,ga=/^true\/(.*)/,ha=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ia={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ia.optgroup=ia.option,ia.tbody=ia.tfoot=ia.colgroup=ia.caption=ia.thead,ia.th=ia.td;function ja(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function ka(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function la(a){var b=ga.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function ma(a,b){for(var c=0,d=a.length;d>c;c++)L.set(a[c],"globalEval",!b||L.get(b[c],"globalEval"))}function na(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(L.hasData(a)&&(f=L.access(a),g=L.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;d>c;c++)n.event.add(b,e,j[e][c])}M.hasData(a)&&(h=M.access(a),i=n.extend({},h),M.set(b,i))}}function oa(a,b){var c=a.getElementsByTagName?a.getElementsByTagName(b||"*"):a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&n.nodeName(a,b)?n.merge([a],c):c}function pa(a,b){var c=b.nodeName.toLowerCase();"input"===c&&T.test(a.type)?b.checked=a.checked:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}n.extend({clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=n.contains(a.ownerDocument,a);if(!(k.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(g=oa(h),f=oa(a),d=0,e=f.length;e>d;d++)pa(f[d],g[d]);if(b)if(c)for(f=f||oa(a),g=g||oa(h),d=0,e=f.length;e>d;d++)na(f[d],g[d]);else na(a,h);return g=oa(h,"script"),g.length>0&&ma(g,!i&&oa(a,"script")),h},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,k=b.createDocumentFragment(),l=[],m=0,o=a.length;o>m;m++)if(e=a[m],e||0===e)if("object"===n.type(e))n.merge(l,e.nodeType?[e]:e);else if(ca.test(e)){f=f||k.appendChild(b.createElement("div")),g=(ba.exec(e)||["",""])[1].toLowerCase(),h=ia[g]||ia._default,f.innerHTML=h[1]+e.replace(aa,"<$1></$2>")+h[2],j=h[0];while(j--)f=f.lastChild;n.merge(l,f.childNodes),f=k.firstChild,f.textContent=""}else l.push(b.createTextNode(e));k.textContent="",m=0;while(e=l[m++])if((!d||-1===n.inArray(e,d))&&(i=n.contains(e.ownerDocument,e),f=oa(k.appendChild(e),"script"),i&&ma(f),c)){j=0;while(e=f[j++])fa.test(e.type||"")&&c.push(e)}return k},cleanData:function(a){for(var b,c,d,e,f=n.event.special,g=0;void 0!==(c=a[g]);g++){if(n.acceptData(c)&&(e=c[L.expando],e&&(b=L.cache[e]))){if(b.events)for(d in b.events)f[d]?n.event.remove(c,d):n.removeEvent(c,d,b.handle);L.cache[e]&&delete L.cache[e]}delete M.cache[c[M.expando]]}}}),n.fn.extend({text:function(a){return J(this,function(a){return void 0===a?n.text(this):this.empty().each(function(){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&(this.textContent=a)})},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=ja(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=ja(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?n.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||n.cleanData(oa(c)),c.parentNode&&(b&&n.contains(c.ownerDocument,c)&&ma(oa(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(n.cleanData(oa(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return J(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!da.test(a)&&!ia[(ba.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(aa,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(oa(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,n.cleanData(oa(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,l=this.length,m=this,o=l-1,p=a[0],q=n.isFunction(p);if(q||l>1&&"string"==typeof p&&!k.checkClone&&ea.test(p))return this.each(function(c){var d=m.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(l&&(c=n.buildFragment(a,this[0].ownerDocument,!1,this),d=c.firstChild,1===c.childNodes.length&&(c=d),d)){for(f=n.map(oa(c,"script"),ka),g=f.length;l>j;j++)h=c,j!==o&&(h=n.clone(h,!0,!0),g&&n.merge(f,oa(h,"script"))),b.call(this[j],h,j);if(g)for(i=f[f.length-1].ownerDocument,n.map(f,la),j=0;g>j;j++)h=f[j],fa.test(h.type||"")&&!L.access(h,"globalEval")&&n.contains(i,h)&&(h.src?n._evalUrl&&n._evalUrl(h.src):n.globalEval(h.textContent.replace(ha,"")))}return this}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=[],e=n(a),g=e.length-1,h=0;g>=h;h++)c=h===g?this:this.clone(!0),n(e[h])[b](c),f.apply(d,c.get());return this.pushStack(d)}});var qa,ra={};function sa(b,c){var d,e=n(c.createElement(b)).appendTo(c.body),f=a.getDefaultComputedStyle&&(d=a.getDefaultComputedStyle(e[0]))?d.display:n.css(e[0],"display");return e.detach(),f}function ta(a){var b=l,c=ra[a];return c||(c=sa(a,b),"none"!==c&&c||(qa=(qa||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=qa[0].contentDocument,b.write(),b.close(),c=sa(a,b),qa.detach()),ra[a]=c),c}var ua=/^margin/,va=new RegExp("^("+Q+")(?!px)[a-z%]+$","i"),wa=function(b){return b.ownerDocument.defaultView.opener?b.ownerDocument.defaultView.getComputedStyle(b,null):a.getComputedStyle(b,null)};function xa(a,b,c){var d,e,f,g,h=a.style;return c=c||wa(a),c&&(g=c.getPropertyValue(b)||c[b]),c&&(""!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),va.test(g)&&ua.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function ya(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d=l.documentElement,e=l.createElement("div"),f=l.createElement("div");if(f.style){f.style.backgroundClip="content-box",f.cloneNode(!0).style.backgroundClip="",k.clearCloneStyle="content-box"===f.style.backgroundClip,e.style.cssText="border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;position:absolute",e.appendChild(f);function g(){f.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute",f.innerHTML="",d.appendChild(e);var g=a.getComputedStyle(f,null);b="1%"!==g.top,c="4px"===g.width,d.removeChild(e)}a.getComputedStyle&&n.extend(k,{pixelPosition:function(){return g(),b},boxSizingReliable:function(){return null==c&&g(),c},reliableMarginRight:function(){var b,c=f.appendChild(l.createElement("div"));return c.style.cssText=f.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",c.style.marginRight=c.style.width="0",f.style.width="1px",d.appendChild(e),b=!parseFloat(a.getComputedStyle(c,null).marginRight),d.removeChild(e),f.removeChild(c),b}})}}(),n.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var za=/^(none|table(?!-c[ea]).+)/,Aa=new RegExp("^("+Q+")(.*)$","i"),Ba=new RegExp("^([+-])=("+Q+")","i"),Ca={position:"absolute",visibility:"hidden",display:"block"},Da={letterSpacing:"0",fontWeight:"400"},Ea=["Webkit","O","Moz","ms"];function Fa(a,b){if(b in a)return b;var c=b[0].toUpperCase()+b.slice(1),d=b,e=Ea.length;while(e--)if(b=Ea[e]+c,b in a)return b;return d}function Ga(a,b,c){var d=Aa.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Ha(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+R[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+R[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+R[f]+"Width",!0,e))):(g+=n.css(a,"padding"+R[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+R[f]+"Width",!0,e)));return g}function Ia(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=wa(a),g="border-box"===n.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=xa(a,b,f),(0>e||null==e)&&(e=a.style[b]),va.test(e))return e;d=g&&(k.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Ha(a,b,c||(g?"border":"content"),d,f)+"px"}function Ja(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=L.get(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&S(d)&&(f[g]=L.access(d,"olddisplay",ta(d.nodeName)))):(e=S(d),"none"===c&&e||L.set(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=xa(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;return b=n.cssProps[h]||(n.cssProps[h]=Fa(i,h)),g=n.cssHooks[b]||n.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=Ba.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(n.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||n.cssNumber[h]||(c+="px"),k.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=Fa(a.style,h)),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=xa(a,b,d)),"normal"===e&&b in Da&&(e=Da[b]),""===c||c?(f=parseFloat(e),c===!0||n.isNumeric(f)?f||0:e):e}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?za.test(n.css(a,"display"))&&0===a.offsetWidth?n.swap(a,Ca,function(){return Ia(a,b,d)}):Ia(a,b,d):void 0},set:function(a,c,d){var e=d&&wa(a);return Ga(a,c,d?Ha(a,b,d,"border-box"===n.css(a,"boxSizing",!1,e),e):0)}}}),n.cssHooks.marginRight=ya(k.reliableMarginRight,function(a,b){return b?n.swap(a,{display:"inline-block"},xa,[a,"marginRight"]):void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+R[d]+b]=f[d]||f[d-2]||f[0];return e}},ua.test(a)||(n.cssHooks[a+b].set=Ga)}),n.fn.extend({css:function(a,b){return J(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=wa(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return Ja(this,!0)},hide:function(){return Ja(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){S(this)?n(this).show():n(this).hide()})}});function Ka(a,b,c,d,e){return new Ka.prototype.init(a,b,c,d,e)}n.Tween=Ka,Ka.prototype={constructor:Ka,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=Ka.propHooks[this.prop];return a&&a.get?a.get(this):Ka.propHooks._default.get(this)},run:function(a){var b,c=Ka.propHooks[this.prop];return this.options.duration?this.pos=b=n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Ka.propHooks._default.set(this),this}},Ka.prototype.init.prototype=Ka.prototype,Ka.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[n.cssProps[a.prop]]||n.cssHooks[a.prop])?n.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Ka.propHooks.scrollTop=Ka.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},n.fx=Ka.prototype.init,n.fx.step={};var La,Ma,Na=/^(?:toggle|show|hide)$/,Oa=new RegExp("^(?:([+-])=|)("+Q+")([a-z%]*)$","i"),Pa=/queueHooks$/,Qa=[Va],Ra={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=Oa.exec(b),f=e&&e[3]||(n.cssNumber[a]?"":"px"),g=(n.cssNumber[a]||"px"!==f&&+d)&&Oa.exec(n.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,n.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function Sa(){return setTimeout(function(){La=void 0}),La=n.now()}function Ta(a,b){var c,d=0,e={height:a};for(b=b?1:0;4>d;d+=2-b)c=R[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function Ua(a,b,c){for(var d,e=(Ra[b]||[]).concat(Ra["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function Va(a,b,c){var d,e,f,g,h,i,j,k,l=this,m={},o=a.style,p=a.nodeType&&S(a),q=L.get(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,l.always(function(){l.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=n.css(a,"display"),k="none"===j?L.get(a,"olddisplay")||ta(a.nodeName):j,"inline"===k&&"none"===n.css(a,"float")&&(o.display="inline-block")),c.overflow&&(o.overflow="hidden",l.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],Na.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}m[d]=q&&q[d]||n.style(a,d)}else j=void 0;if(n.isEmptyObject(m))"inline"===("none"===j?ta(a.nodeName):j)&&(o.display=j);else{q?"hidden"in q&&(p=q.hidden):q=L.access(a,"fxshow",{}),f&&(q.hidden=!p),p?n(a).show():l.done(function(){n(a).hide()}),l.done(function(){var b;L.remove(a,"fxshow");for(b in m)n.style(a,b,m[b])});for(d in m)g=Ua(p?q[d]:0,d,l),d in q||(q[d]=g.start,p&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function Wa(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function Xa(a,b,c){var d,e,f=0,g=Qa.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=La||Sa(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:La||Sa(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(Wa(k,j.opts.specialEasing);g>f;f++)if(d=Qa[f].call(j,a,k,j.opts))return d;return n.map(k,Ua,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(Xa,{tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],Ra[c]=Ra[c]||[],Ra[c].unshift(b)},prefilter:function(a,b){b?Qa.unshift(a):Qa.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(S).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=Xa(this,n.extend({},a),f);(e||L.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=L.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&Pa.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=L.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(Ta(b,!0),a,d,e)}}),n.each({slideDown:Ta("show"),slideUp:Ta("hide"),slideToggle:Ta("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=0,c=n.timers;for(La=n.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||n.fx.stop(),La=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){Ma||(Ma=setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){clearInterval(Ma),Ma=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(a,b){return a=n.fx?n.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a=l.createElement("input"),b=l.createElement("select"),c=b.appendChild(l.createElement("option"));a.type="checkbox",k.checkOn=""!==a.value,k.optSelected=c.selected,b.disabled=!0,k.optDisabled=!c.disabled,a=l.createElement("input"),a.value="t",a.type="radio",k.radioValue="t"===a.value}();var Ya,Za,$a=n.expr.attrHandle;n.fn.extend({attr:function(a,b){return J(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===U?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),d=n.attrHooks[b]||(n.expr.match.bool.test(b)?Za:Ya)),
void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=n.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void n.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)&&(a[d]=!1),a.removeAttribute(c)},attrHooks:{type:{set:function(a,b){if(!k.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),Za={set:function(a,b,c){return b===!1?n.removeAttr(a,c):a.setAttribute(c,c),c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=$a[b]||n.find.attr;$a[b]=function(a,b,d){var e,f;return d||(f=$a[b],$a[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,$a[b]=f),e}});var _a=/^(?:input|select|textarea|button)$/i;n.fn.extend({prop:function(a,b){return J(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[n.propFix[a]||a]})}}),n.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!n.isXMLDoc(a),f&&(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){return a.hasAttribute("tabindex")||_a.test(a.nodeName)||a.href?a.tabIndex:-1}}}}),k.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this});var ab=/[\t\r\n\f]/g;n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h="string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ab," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=n.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0===arguments.length||"string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ab," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?n.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(n.isFunction(a)?function(c){n(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=n(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===U||"boolean"===c)&&(this.className&&L.set(this,"__className__",this.className),this.className=this.className||a===!1?"":L.get(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(ab," ").indexOf(b)>=0)return!0;return!1}});var bb=/\r/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(bb,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.trim(n.text(a))}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(k.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=n.inArray(d.value,f)>=0)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>=0:void 0}},k.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var cb=n.now(),db=/\?/;n.parseJSON=function(a){return JSON.parse(a+"")},n.parseXML=function(a){var b,c;if(!a||"string"!=typeof a)return null;try{c=new DOMParser,b=c.parseFromString(a,"text/xml")}catch(d){b=void 0}return(!b||b.getElementsByTagName("parsererror").length)&&n.error("Invalid XML: "+a),b};var eb=/#.*$/,fb=/([?&])_=[^&]*/,gb=/^(.*?):[ \t]*([^\r\n]*)$/gm,hb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,ib=/^(?:GET|HEAD)$/,jb=/^\/\//,kb=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,lb={},mb={},nb="*/".concat("*"),ob=a.location.href,pb=kb.exec(ob.toLowerCase())||[];function qb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(n.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function rb(a,b,c,d){var e={},f=a===mb;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function sb(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&n.extend(!0,a,d),a}function tb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function ub(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:ob,type:"GET",isLocal:hb.test(pb[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":nb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?sb(sb(a,n.ajaxSettings),b):sb(n.ajaxSettings,a)},ajaxPrefilter:qb(lb),ajaxTransport:qb(mb),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=n.ajaxSetup({},b),l=k.context||k,m=k.context&&(l.nodeType||l.jquery)?n(l):n.event,o=n.Deferred(),p=n.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!f){f={};while(b=gb.exec(e))f[b[1].toLowerCase()]=b[2]}b=f[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?e:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return c&&c.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||ob)+"").replace(eb,"").replace(jb,pb[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=n.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(h=kb.exec(k.url.toLowerCase()),k.crossDomain=!(!h||h[1]===pb[1]&&h[2]===pb[2]&&(h[3]||("http:"===h[1]?"80":"443"))===(pb[3]||("http:"===pb[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=n.param(k.data,k.traditional)),rb(lb,k,b,v),2===t)return v;i=n.event&&k.global,i&&0===n.active++&&n.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!ib.test(k.type),d=k.url,k.hasContent||(k.data&&(d=k.url+=(db.test(d)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=fb.test(d)?d.replace(fb,"$1_="+cb++):d+(db.test(d)?"&":"?")+"_="+cb++)),k.ifModified&&(n.lastModified[d]&&v.setRequestHeader("If-Modified-Since",n.lastModified[d]),n.etag[d]&&v.setRequestHeader("If-None-Match",n.etag[d])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+nb+"; q=0.01":""):k.accepts["*"]);for(j in k.headers)v.setRequestHeader(j,k.headers[j]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(j in{success:1,error:1,complete:1})v[j](k[j]);if(c=rb(mb,k,b,v)){v.readyState=1,i&&m.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,c.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,f,h){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),c=void 0,e=h||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,f&&(u=tb(k,v,f)),u=ub(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(n.lastModified[d]=w),w=v.getResponseHeader("etag"),w&&(n.etag[d]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,i&&m.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),i&&(m.trigger("ajaxComplete",[v,k]),--n.active||n.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){var b;return n.isFunction(a)?this.each(function(b){n(this).wrapAll(a.call(this,b))}):(this[0]&&(b=n(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this)},wrapInner:function(a){return this.each(n.isFunction(a)?function(b){n(this).wrapInner(a.call(this,b))}:function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}}),n.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0},n.expr.filters.visible=function(a){return!n.expr.filters.hidden(a)};var vb=/%20/g,wb=/\[\]$/,xb=/\r?\n/g,yb=/^(?:submit|button|image|reset|file)$/i,zb=/^(?:input|select|textarea|keygen)/i;function Ab(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||wb.test(a)?d(a,e):Ab(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)Ab(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)Ab(c,a[c],b,e);return d.join("&").replace(vb,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&zb.test(this.nodeName)&&!yb.test(a)&&(this.checked||!T.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(xb,"\r\n")}}):{name:b.name,value:c.replace(xb,"\r\n")}}).get()}}),n.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(a){}};var Bb=0,Cb={},Db={0:200,1223:204},Eb=n.ajaxSettings.xhr();a.attachEvent&&a.attachEvent("onunload",function(){for(var a in Cb)Cb[a]()}),k.cors=!!Eb&&"withCredentials"in Eb,k.ajax=Eb=!!Eb,n.ajaxTransport(function(a){var b;return k.cors||Eb&&!a.crossDomain?{send:function(c,d){var e,f=a.xhr(),g=++Bb;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)f.setRequestHeader(e,c[e]);b=function(a){return function(){b&&(delete Cb[g],b=f.onload=f.onerror=null,"abort"===a?f.abort():"error"===a?d(f.status,f.statusText):d(Db[f.status]||f.status,f.statusText,"string"==typeof f.responseText?{text:f.responseText}:void 0,f.getAllResponseHeaders()))}},f.onload=b(),f.onerror=b("error"),b=Cb[g]=b("abort");try{f.send(a.hasContent&&a.data||null)}catch(h){if(b)throw h}},abort:function(){b&&b()}}:void 0}),n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(d,e){b=n("<script>").prop({async:!0,charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&e("error"===a.type?404:200,a.type)}),l.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Fb=[],Gb=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Fb.pop()||n.expando+"_"+cb++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Gb.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Gb.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Gb,"$1"+e):b.jsonp!==!1&&(b.url+=(db.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Fb.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||l;var d=v.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=n.buildFragment([a],b,e),e&&e.length&&n(e).remove(),n.merge([],d.childNodes))};var Hb=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&Hb)return Hb.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=n.trim(a.slice(h)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e,dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,f||[a.responseText,b,a])}),this},n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};var Ib=a.document.documentElement;function Jb(a){return n.isWindow(a)?a:9===a.nodeType&&a.defaultView}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d=this[0],e={top:0,left:0},f=d&&d.ownerDocument;if(f)return b=f.documentElement,n.contains(b,d)?(typeof d.getBoundingClientRect!==U&&(e=d.getBoundingClientRect()),c=Jb(f),{top:e.top+c.pageYOffset-b.clientTop,left:e.left+c.pageXOffset-b.clientLeft}):e},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===n.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(d=a.offset()),d.top+=n.css(a[0],"borderTopWidth",!0),d.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-d.top-n.css(c,"marginTop",!0),left:b.left-d.left-n.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||Ib;while(a&&!n.nodeName(a,"html")&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Ib})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(b,c){var d="pageYOffset"===c;n.fn[b]=function(e){return J(this,function(b,e,f){var g=Jb(b);return void 0===f?g?g[c]:b[e]:void(g?g.scrollTo(d?a.pageXOffset:f,d?f:a.pageYOffset):b[e]=f)},b,e,arguments.length,null)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=ya(k.pixelPosition,function(a,c){return c?(c=xa(a,b),va.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return J(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.size=function(){return this.length},n.fn.andSelf=n.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return n});var Kb=a.jQuery,Lb=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=Lb),b&&a.jQuery===n&&(a.jQuery=Kb),n},typeof b===U&&(a.jQuery=a.$=n),n});

; browserify_shim__define__module__export__(typeof $ != "undefined" ? $ : window.$);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
require('jquery');
require('./plugin/jquery.inputmask.bundle.min');
require('./plugin/jquery.validate.min');
//require('./plugin/slick');
require('./plugin/svg');
// require('./plugin/svg.pathmorphing.js');
require('./plugin/ion.rangeSlider.min');
require('./plugin/animatescroll.min');
require('./popups.js');
require('./forms.js');
require('./script.js');

},{"./forms.js":1,"./plugin/animatescroll.min":4,"./plugin/ion.rangeSlider.min":5,"./plugin/jquery.inputmask.bundle.min":6,"./plugin/jquery.validate.min":7,"./plugin/svg":8,"./popups.js":9,"./script.js":10,"jquery":2}],4:[function(require,module,exports){
/* Coded by Ramswaroop */
(function(e){e.easing["jswing"]=e.easing["swing"];e.extend(e.easing,{def:"easeOutQuad",swing:function(t,n,r,i,s){return e.easing[e.easing.def](t,n,r,i,s)},easeInQuad:function(e,t,n,r,i){return r*(t/=i)*t+n},easeOutQuad:function(e,t,n,r,i){return-r*(t/=i)*(t-2)+n},easeInOutQuad:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t+n;return-r/2*(--t*(t-2)-1)+n},easeInCubic:function(e,t,n,r,i){return r*(t/=i)*t*t+n},easeOutCubic:function(e,t,n,r,i){return r*((t=t/i-1)*t*t+1)+n},easeInOutCubic:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t*t+n;return r/2*((t-=2)*t*t+2)+n},easeInQuart:function(e,t,n,r,i){return r*(t/=i)*t*t*t+n},easeOutQuart:function(e,t,n,r,i){return-r*((t=t/i-1)*t*t*t-1)+n},easeInOutQuart:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t*t*t+n;return-r/2*((t-=2)*t*t*t-2)+n},easeInQuint:function(e,t,n,r,i){return r*(t/=i)*t*t*t*t+n},easeOutQuint:function(e,t,n,r,i){return r*((t=t/i-1)*t*t*t*t+1)+n},easeInOutQuint:function(e,t,n,r,i){if((t/=i/2)<1)return r/2*t*t*t*t*t+n;return r/2*((t-=2)*t*t*t*t+2)+n},easeInSine:function(e,t,n,r,i){return-r*Math.cos(t/i*(Math.PI/2))+r+n},easeOutSine:function(e,t,n,r,i){return r*Math.sin(t/i*(Math.PI/2))+n},easeInOutSine:function(e,t,n,r,i){return-r/2*(Math.cos(Math.PI*t/i)-1)+n},easeInExpo:function(e,t,n,r,i){return t==0?n:r*Math.pow(2,10*(t/i-1))+n},easeOutExpo:function(e,t,n,r,i){return t==i?n+r:r*(-Math.pow(2,-10*t/i)+1)+n},easeInOutExpo:function(e,t,n,r,i){if(t==0)return n;if(t==i)return n+r;if((t/=i/2)<1)return r/2*Math.pow(2,10*(t-1))+n;return r/2*(-Math.pow(2,-10*--t)+2)+n},easeInCirc:function(e,t,n,r,i){return-r*(Math.sqrt(1-(t/=i)*t)-1)+n},easeOutCirc:function(e,t,n,r,i){return r*Math.sqrt(1-(t=t/i-1)*t)+n},easeInOutCirc:function(e,t,n,r,i){if((t/=i/2)<1)return-r/2*(Math.sqrt(1-t*t)-1)+n;return r/2*(Math.sqrt(1-(t-=2)*t)+1)+n},easeInElastic:function(e,t,n,r,i){var s=1.70158;var o=0;var u=r;if(t==0)return n;if((t/=i)==1)return n+r;if(!o)o=i*.3;if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math.PI)*Math.asin(r/u);return-(u*Math.pow(2,10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o))+n},easeOutElastic:function(e,t,n,r,i){var s=1.70158;var o=0;var u=r;if(t==0)return n;if((t/=i)==1)return n+r;if(!o)o=i*.3;if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math.PI)*Math.asin(r/u);return u*Math.pow(2,-10*t)*Math.sin((t*i-s)*2*Math.PI/o)+r+n},easeInOutElastic:function(e,t,n,r,i){var s=1.70158;var o=0;var u=r;if(t==0)return n;if((t/=i/2)==2)return n+r;if(!o)o=i*.3*1.5;if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math.PI)*Math.asin(r/u);if(t<1)return-.5*u*Math.pow(2,10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o)+n;return u*Math.pow(2,-10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o)*.5+r+n},easeInBack:function(e,t,n,r,i,s){if(s==undefined)s=1.70158;return r*(t/=i)*t*((s+1)*t-s)+n},easeOutBack:function(e,t,n,r,i,s){if(s==undefined)s=1.70158;return r*((t=t/i-1)*t*((s+1)*t+s)+1)+n},easeInOutBack:function(e,t,n,r,i,s){if(s==undefined)s=1.70158;if((t/=i/2)<1)return r/2*t*t*(((s*=1.525)+1)*t-s)+n;return r/2*((t-=2)*t*(((s*=1.525)+1)*t+s)+2)+n},easeInBounce:function(t,n,r,i,s){return i-e.easing.easeOutBounce(t,s-n,0,i,s)+r},easeOutBounce:function(e,t,n,r,i){if((t/=i)<1/2.75){return r*7.5625*t*t+n}else if(t<2/2.75){return r*(7.5625*(t-=1.5/2.75)*t+.75)+n}else if(t<2.5/2.75){return r*(7.5625*(t-=2.25/2.75)*t+.9375)+n}else{return r*(7.5625*(t-=2.625/2.75)*t+.984375)+n}},easeInOutBounce:function(t,n,r,i,s){if(n<s/2)return e.easing.easeInBounce(t,n*2,0,i,s)*.5+r;return e.easing.easeOutBounce(t,n*2-s,0,i,s)*.5+i*.5+r}});e.fn.animatescroll=function(t){var n=e.extend({},e.fn.animatescroll.defaults,t);if(typeof n.onScrollStart=="function"){n.onScrollStart.call(this)}if(n.element=="html,body"){var r=this.offset().top;e(n.element).stop().animate({scrollTop:r-n.padding},n.scrollSpeed,n.easing)}else{e(n.element).stop().animate({scrollTop:this.offset().top-this.parent().offset().top+this.parent().scrollTop()-n.padding},n.scrollSpeed,n.easing)}setTimeout(function(){if(typeof n.onScrollEnd=="function"){n.onScrollEnd.call(this)}},n.scrollSpeed)};e.fn.animatescroll.defaults={easing:"swing",scrollSpeed:800,padding:0,element:"html,body"}})(jQuery)
},{}],5:[function(require,module,exports){
// Ion.RangeSlider, 2.3.0, © Denis Ineshin, 2010 - 2018, IonDen.com, Build date: 2018-12-12 00:00:37
!function(i){!jQuery&&"function"==typeof define&&define.amd?define(["jquery"],function(t){return i(t,document,window,navigator)}):jQuery||"object"!=typeof exports?i(jQuery,document,window,navigator):i(require("jquery"),document,window,navigator)}(function(a,c,l,t,_){"use strict";var i,s,o=0,e=(i=t.userAgent,s=/msie\s\d+/i,0<i.search(s)&&s.exec(i).toString().split(" ")[1]<9&&(a("html").addClass("lt-ie9"),!0));Function.prototype.bind||(Function.prototype.bind=function(o){var e=this,h=[].slice;if("function"!=typeof e)throw new TypeError;var r=h.call(arguments,1),n=function(){if(this instanceof n){var t=function(){};t.prototype=e.prototype;var i=new t,s=e.apply(i,r.concat(h.call(arguments)));return Object(s)===s?s:i}return e.apply(o,r.concat(h.call(arguments)))};return n}),Array.prototype.indexOf||(Array.prototype.indexOf=function(t,i){var s;if(null==this)throw new TypeError('"this" is null or not defined');var o=Object(this),e=o.length>>>0;if(0===e)return-1;var h=+i||0;if(Math.abs(h)===1/0&&(h=0),e<=h)return-1;for(s=Math.max(0<=h?h:e-Math.abs(h),0);s<e;){if(s in o&&o[s]===t)return s;s++}return-1});var h=function(t,i,s){this.VERSION="2.3.0",this.input=t,this.plugin_count=s,this.current_plugin=0,this.calc_count=0,this.update_tm=0,this.old_from=0,this.old_to=0,this.old_min_interval=null,this.raf_id=null,this.dragging=!1,this.force_redraw=!1,this.no_diapason=!1,this.has_tab_index=!0,this.is_key=!1,this.is_update=!1,this.is_start=!0,this.is_finish=!1,this.is_active=!1,this.is_resize=!1,this.is_click=!1,i=i||{},this.$cache={win:a(l),body:a(c.body),input:a(t),cont:null,rs:null,min:null,max:null,from:null,to:null,single:null,bar:null,line:null,s_single:null,s_from:null,s_to:null,shad_single:null,shad_from:null,shad_to:null,edge:null,grid:null,grid_labels:[]},this.coords={x_gap:0,x_pointer:0,w_rs:0,w_rs_old:0,w_handle:0,p_gap:0,p_gap_left:0,p_gap_right:0,p_step:0,p_pointer:0,p_handle:0,p_single_fake:0,p_single_real:0,p_from_fake:0,p_from_real:0,p_to_fake:0,p_to_real:0,p_bar_x:0,p_bar_w:0,grid_gap:0,big_num:0,big:[],big_w:[],big_p:[],big_x:[]},this.labels={w_min:0,w_max:0,w_from:0,w_to:0,w_single:0,p_min:0,p_max:0,p_from_fake:0,p_from_left:0,p_to_fake:0,p_to_left:0,p_single_fake:0,p_single_left:0};var o,e,h,r=this.$cache.input,n=r.prop("value");for(h in o={skin:"flat",type:"single",min:10,max:100,from:null,to:null,step:1,min_interval:0,max_interval:0,drag_interval:!1,values:[],p_values:[],from_fixed:!1,from_min:null,from_max:null,from_shadow:!1,to_fixed:!1,to_min:null,to_max:null,to_shadow:!1,prettify_enabled:!0,prettify_separator:" ",prettify:null,force_edges:!1,keyboard:!0,grid:!1,grid_margin:!0,grid_num:4,grid_snap:!1,hide_min_max:!1,hide_from_to:!1,prefix:"",postfix:"",max_postfix:"",decorate_both:!0,values_separator:" — ",input_values_separator:";",disable:!1,block:!1,extra_classes:"",scope:null,onStart:null,onChange:null,onFinish:null,onUpdate:null},"INPUT"!==r[0].nodeName&&console&&console.warn&&console.warn("Base element should be <input>!",r[0]),(e={skin:r.data("skin"),type:r.data("type"),min:r.data("min"),max:r.data("max"),from:r.data("from"),to:r.data("to"),step:r.data("step"),min_interval:r.data("minInterval"),max_interval:r.data("maxInterval"),drag_interval:r.data("dragInterval"),values:r.data("values"),from_fixed:r.data("fromFixed"),from_min:r.data("fromMin"),from_max:r.data("fromMax"),from_shadow:r.data("fromShadow"),to_fixed:r.data("toFixed"),to_min:r.data("toMin"),to_max:r.data("toMax"),to_shadow:r.data("toShadow"),prettify_enabled:r.data("prettifyEnabled"),prettify_separator:r.data("prettifySeparator"),force_edges:r.data("forceEdges"),keyboard:r.data("keyboard"),grid:r.data("grid"),grid_margin:r.data("gridMargin"),grid_num:r.data("gridNum"),grid_snap:r.data("gridSnap"),hide_min_max:r.data("hideMinMax"),hide_from_to:r.data("hideFromTo"),prefix:r.data("prefix"),postfix:r.data("postfix"),max_postfix:r.data("maxPostfix"),decorate_both:r.data("decorateBoth"),values_separator:r.data("valuesSeparator"),input_values_separator:r.data("inputValuesSeparator"),disable:r.data("disable"),block:r.data("block"),extra_classes:r.data("extraClasses")}).values=e.values&&e.values.split(","),e)e.hasOwnProperty(h)&&(e[h]!==_&&""!==e[h]||delete e[h]);n!==_&&""!==n&&((n=n.split(e.input_values_separator||i.input_values_separator||";"))[0]&&n[0]==+n[0]&&(n[0]=+n[0]),n[1]&&n[1]==+n[1]&&(n[1]=+n[1]),i&&i.values&&i.values.length?(o.from=n[0]&&i.values.indexOf(n[0]),o.to=n[1]&&i.values.indexOf(n[1])):(o.from=n[0]&&+n[0],o.to=n[1]&&+n[1])),a.extend(o,i),a.extend(o,e),this.options=o,this.update_check={},this.validate(),this.result={input:this.$cache.input,slider:null,min:this.options.min,max:this.options.max,from:this.options.from,from_percent:0,from_value:null,to:this.options.to,to_percent:0,to_value:null},this.init()};h.prototype={init:function(t){this.no_diapason=!1,this.coords.p_step=this.convertToPercent(this.options.step,!0),this.target="base",this.toggleInput(),this.append(),this.setMinMax(),t?(this.force_redraw=!0,this.calc(!0),this.callOnUpdate()):(this.force_redraw=!0,this.calc(!0),this.callOnStart()),this.updateScene()},append:function(){var t='<span class="irs irs--'+this.options.skin+" js-irs-"+this.plugin_count+" "+this.options.extra_classes+'"></span>';this.$cache.input.before(t),this.$cache.input.prop("readonly",!0),this.$cache.cont=this.$cache.input.prev(),this.result.slider=this.$cache.cont,this.$cache.cont.html('<span class="irs"><span class="irs-line" tabindex="0"></span><span class="irs-min">0</span><span class="irs-max">1</span><span class="irs-from">0</span><span class="irs-to">0</span><span class="irs-single">0</span></span><span class="irs-grid"></span>'),this.$cache.rs=this.$cache.cont.find(".irs"),this.$cache.min=this.$cache.cont.find(".irs-min"),this.$cache.max=this.$cache.cont.find(".irs-max"),this.$cache.from=this.$cache.cont.find(".irs-from"),this.$cache.to=this.$cache.cont.find(".irs-to"),this.$cache.single=this.$cache.cont.find(".irs-single"),this.$cache.line=this.$cache.cont.find(".irs-line"),this.$cache.grid=this.$cache.cont.find(".irs-grid"),"single"===this.options.type?(this.$cache.cont.append('<span class="irs-bar irs-bar--single"></span><span class="irs-shadow shadow-single"></span><span class="irs-handle single"><i></i><i></i><i></i></span>'),this.$cache.bar=this.$cache.cont.find(".irs-bar"),this.$cache.edge=this.$cache.cont.find(".irs-bar-edge"),this.$cache.s_single=this.$cache.cont.find(".single"),this.$cache.from[0].style.visibility="hidden",this.$cache.to[0].style.visibility="hidden",this.$cache.shad_single=this.$cache.cont.find(".shadow-single")):(this.$cache.cont.append('<span class="irs-bar"></span><span class="irs-shadow shadow-from"></span><span class="irs-shadow shadow-to"></span><span class="irs-handle from"><i></i><i></i><i></i></span><span class="irs-handle to"><i></i><i></i><i></i></span>'),this.$cache.bar=this.$cache.cont.find(".irs-bar"),this.$cache.s_from=this.$cache.cont.find(".from"),this.$cache.s_to=this.$cache.cont.find(".to"),this.$cache.shad_from=this.$cache.cont.find(".shadow-from"),this.$cache.shad_to=this.$cache.cont.find(".shadow-to"),this.setTopHandler()),this.options.hide_from_to&&(this.$cache.from[0].style.display="none",this.$cache.to[0].style.display="none",this.$cache.single[0].style.display="none"),this.appendGrid(),this.options.disable?(this.appendDisableMask(),this.$cache.input[0].disabled=!0):(this.$cache.input[0].disabled=!1,this.removeDisableMask(),this.bindEvents()),this.options.disable||(this.options.block?this.appendDisableMask():this.removeDisableMask()),this.options.drag_interval&&(this.$cache.bar[0].style.cursor="ew-resize")},setTopHandler:function(){var t=this.options.min,i=this.options.max,s=this.options.from,o=this.options.to;t<s&&o===i?this.$cache.s_from.addClass("type_last"):o<i&&this.$cache.s_to.addClass("type_last")},changeLevel:function(t){switch(t){case"single":this.coords.p_gap=this.toFixed(this.coords.p_pointer-this.coords.p_single_fake),this.$cache.s_single.addClass("state_hover");break;case"from":this.coords.p_gap=this.toFixed(this.coords.p_pointer-this.coords.p_from_fake),this.$cache.s_from.addClass("state_hover"),this.$cache.s_from.addClass("type_last"),this.$cache.s_to.removeClass("type_last");break;case"to":this.coords.p_gap=this.toFixed(this.coords.p_pointer-this.coords.p_to_fake),this.$cache.s_to.addClass("state_hover"),this.$cache.s_to.addClass("type_last"),this.$cache.s_from.removeClass("type_last");break;case"both":this.coords.p_gap_left=this.toFixed(this.coords.p_pointer-this.coords.p_from_fake),this.coords.p_gap_right=this.toFixed(this.coords.p_to_fake-this.coords.p_pointer),this.$cache.s_to.removeClass("type_last"),this.$cache.s_from.removeClass("type_last")}},appendDisableMask:function(){this.$cache.cont.append('<span class="irs-disable-mask"></span>'),this.$cache.cont.addClass("irs-disabled")},removeDisableMask:function(){this.$cache.cont.remove(".irs-disable-mask"),this.$cache.cont.removeClass("irs-disabled")},remove:function(){this.$cache.cont.remove(),this.$cache.cont=null,this.$cache.line.off("keydown.irs_"+this.plugin_count),this.$cache.body.off("touchmove.irs_"+this.plugin_count),this.$cache.body.off("mousemove.irs_"+this.plugin_count),this.$cache.win.off("touchend.irs_"+this.plugin_count),this.$cache.win.off("mouseup.irs_"+this.plugin_count),e&&(this.$cache.body.off("mouseup.irs_"+this.plugin_count),this.$cache.body.off("mouseleave.irs_"+this.plugin_count)),this.$cache.grid_labels=[],this.coords.big=[],this.coords.big_w=[],this.coords.big_p=[],this.coords.big_x=[],cancelAnimationFrame(this.raf_id)},bindEvents:function(){this.no_diapason||(this.$cache.body.on("touchmove.irs_"+this.plugin_count,this.pointerMove.bind(this)),this.$cache.body.on("mousemove.irs_"+this.plugin_count,this.pointerMove.bind(this)),this.$cache.win.on("touchend.irs_"+this.plugin_count,this.pointerUp.bind(this)),this.$cache.win.on("mouseup.irs_"+this.plugin_count,this.pointerUp.bind(this)),this.$cache.line.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.line.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.line.on("focus.irs_"+this.plugin_count,this.pointerFocus.bind(this)),this.options.drag_interval&&"double"===this.options.type?(this.$cache.bar.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"both")),this.$cache.bar.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"both"))):(this.$cache.bar.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.bar.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click"))),"single"===this.options.type?(this.$cache.single.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.s_single.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.shad_single.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.single.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.s_single.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"single")),this.$cache.edge.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.shad_single.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click"))):(this.$cache.single.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,null)),this.$cache.single.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,null)),this.$cache.from.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.s_from.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.to.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.s_to.on("touchstart.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.shad_from.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.shad_to.on("touchstart.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.from.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.s_from.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"from")),this.$cache.to.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.s_to.on("mousedown.irs_"+this.plugin_count,this.pointerDown.bind(this,"to")),this.$cache.shad_from.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click")),this.$cache.shad_to.on("mousedown.irs_"+this.plugin_count,this.pointerClick.bind(this,"click"))),this.options.keyboard&&this.$cache.line.on("keydown.irs_"+this.plugin_count,this.key.bind(this,"keyboard")),e&&(this.$cache.body.on("mouseup.irs_"+this.plugin_count,this.pointerUp.bind(this)),this.$cache.body.on("mouseleave.irs_"+this.plugin_count,this.pointerUp.bind(this))))},pointerFocus:function(t){var i,s;this.target||(i=(s="single"===this.options.type?this.$cache.single:this.$cache.from).offset().left,i+=s.width()/2-1,this.pointerClick("single",{preventDefault:function(){},pageX:i}))},pointerMove:function(t){if(this.dragging){var i=t.pageX||t.originalEvent.touches&&t.originalEvent.touches[0].pageX;this.coords.x_pointer=i-this.coords.x_gap,this.calc()}},pointerUp:function(t){this.current_plugin===this.plugin_count&&this.is_active&&(this.is_active=!1,this.$cache.cont.find(".state_hover").removeClass("state_hover"),this.force_redraw=!0,e&&a("*").prop("unselectable",!1),this.updateScene(),this.restoreOriginalMinInterval(),(a.contains(this.$cache.cont[0],t.target)||this.dragging)&&this.callOnFinish(),this.dragging=!1)},pointerDown:function(t,i){i.preventDefault();var s=i.pageX||i.originalEvent.touches&&i.originalEvent.touches[0].pageX;2!==i.button&&("both"===t&&this.setTempMinInterval(),t||(t=this.target||"from"),this.current_plugin=this.plugin_count,this.target=t,this.is_active=!0,this.dragging=!0,this.coords.x_gap=this.$cache.rs.offset().left,this.coords.x_pointer=s-this.coords.x_gap,this.calcPointerPercent(),this.changeLevel(t),e&&a("*").prop("unselectable",!0),this.$cache.line.trigger("focus"),this.updateScene())},pointerClick:function(t,i){i.preventDefault();var s=i.pageX||i.originalEvent.touches&&i.originalEvent.touches[0].pageX;2!==i.button&&(this.current_plugin=this.plugin_count,this.target=t,this.is_click=!0,this.coords.x_gap=this.$cache.rs.offset().left,this.coords.x_pointer=+(s-this.coords.x_gap).toFixed(),this.force_redraw=!0,this.calc(),this.$cache.line.trigger("focus"))},key:function(t,i){if(!(this.current_plugin!==this.plugin_count||i.altKey||i.ctrlKey||i.shiftKey||i.metaKey)){switch(i.which){case 83:case 65:case 40:case 37:i.preventDefault(),this.moveByKey(!1);break;case 87:case 68:case 38:case 39:i.preventDefault(),this.moveByKey(!0)}return!0}},moveByKey:function(t){var i=this.coords.p_pointer,s=(this.options.max-this.options.min)/100;s=this.options.step/s,t?i+=s:i-=s,this.coords.x_pointer=this.toFixed(this.coords.w_rs/100*i),this.is_key=!0,this.calc()},setMinMax:function(){if(this.options){if(this.options.hide_min_max)return this.$cache.min[0].style.display="none",void(this.$cache.max[0].style.display="none");if(this.options.values.length)this.$cache.min.html(this.decorate(this.options.p_values[this.options.min])),this.$cache.max.html(this.decorate(this.options.p_values[this.options.max]));else{var t=this._prettify(this.options.min),i=this._prettify(this.options.max);this.result.min_pretty=t,this.result.max_pretty=i,this.$cache.min.html(this.decorate(t,this.options.min)),this.$cache.max.html(this.decorate(i,this.options.max))}this.labels.w_min=this.$cache.min.outerWidth(!1),this.labels.w_max=this.$cache.max.outerWidth(!1)}},setTempMinInterval:function(){var t=this.result.to-this.result.from;null===this.old_min_interval&&(this.old_min_interval=this.options.min_interval),this.options.min_interval=t},restoreOriginalMinInterval:function(){null!==this.old_min_interval&&(this.options.min_interval=this.old_min_interval,this.old_min_interval=null)},calc:function(t){if(this.options&&(this.calc_count++,(10===this.calc_count||t)&&(this.calc_count=0,this.coords.w_rs=this.$cache.rs.outerWidth(!1),this.calcHandlePercent()),this.coords.w_rs)){this.calcPointerPercent();var i=this.getHandleX();switch("both"===this.target&&(this.coords.p_gap=0,i=this.getHandleX()),"click"===this.target&&(this.coords.p_gap=this.coords.p_handle/2,i=this.getHandleX(),this.options.drag_interval?this.target="both_one":this.target=this.chooseHandle(i)),this.target){case"base":var s=(this.options.max-this.options.min)/100,o=(this.result.from-this.options.min)/s,e=(this.result.to-this.options.min)/s;this.coords.p_single_real=this.toFixed(o),this.coords.p_from_real=this.toFixed(o),this.coords.p_to_real=this.toFixed(e),this.coords.p_single_real=this.checkDiapason(this.coords.p_single_real,this.options.from_min,this.options.from_max),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_single_fake=this.convertToFakePercent(this.coords.p_single_real),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real),this.target=null;break;case"single":if(this.options.from_fixed)break;this.coords.p_single_real=this.convertToRealPercent(i),this.coords.p_single_real=this.calcWithStep(this.coords.p_single_real),this.coords.p_single_real=this.checkDiapason(this.coords.p_single_real,this.options.from_min,this.options.from_max),this.coords.p_single_fake=this.convertToFakePercent(this.coords.p_single_real);break;case"from":if(this.options.from_fixed)break;this.coords.p_from_real=this.convertToRealPercent(i),this.coords.p_from_real=this.calcWithStep(this.coords.p_from_real),this.coords.p_from_real>this.coords.p_to_real&&(this.coords.p_from_real=this.coords.p_to_real),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_from_real=this.checkMinInterval(this.coords.p_from_real,this.coords.p_to_real,"from"),this.coords.p_from_real=this.checkMaxInterval(this.coords.p_from_real,this.coords.p_to_real,"from"),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real);break;case"to":if(this.options.to_fixed)break;this.coords.p_to_real=this.convertToRealPercent(i),this.coords.p_to_real=this.calcWithStep(this.coords.p_to_real),this.coords.p_to_real<this.coords.p_from_real&&(this.coords.p_to_real=this.coords.p_from_real),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_to_real=this.checkMinInterval(this.coords.p_to_real,this.coords.p_from_real,"to"),this.coords.p_to_real=this.checkMaxInterval(this.coords.p_to_real,this.coords.p_from_real,"to"),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real);break;case"both":if(this.options.from_fixed||this.options.to_fixed)break;i=this.toFixed(i+.001*this.coords.p_handle),this.coords.p_from_real=this.convertToRealPercent(i)-this.coords.p_gap_left,this.coords.p_from_real=this.calcWithStep(this.coords.p_from_real),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_from_real=this.checkMinInterval(this.coords.p_from_real,this.coords.p_to_real,"from"),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real),this.coords.p_to_real=this.convertToRealPercent(i)+this.coords.p_gap_right,this.coords.p_to_real=this.calcWithStep(this.coords.p_to_real),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_to_real=this.checkMinInterval(this.coords.p_to_real,this.coords.p_from_real,"to"),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real);break;case"both_one":if(this.options.from_fixed||this.options.to_fixed)break;var h=this.convertToRealPercent(i),r=this.result.from_percent,n=this.result.to_percent-r,a=n/2,c=h-a,l=h+a;c<0&&(l=(c=0)+n),100<l&&(c=(l=100)-n),this.coords.p_from_real=this.calcWithStep(c),this.coords.p_from_real=this.checkDiapason(this.coords.p_from_real,this.options.from_min,this.options.from_max),this.coords.p_from_fake=this.convertToFakePercent(this.coords.p_from_real),this.coords.p_to_real=this.calcWithStep(l),this.coords.p_to_real=this.checkDiapason(this.coords.p_to_real,this.options.to_min,this.options.to_max),this.coords.p_to_fake=this.convertToFakePercent(this.coords.p_to_real)}"single"===this.options.type?(this.coords.p_bar_x=this.coords.p_handle/2,this.coords.p_bar_w=this.coords.p_single_fake,this.result.from_percent=this.coords.p_single_real,this.result.from=this.convertToValue(this.coords.p_single_real),this.result.from_pretty=this._prettify(this.result.from),this.options.values.length&&(this.result.from_value=this.options.values[this.result.from])):(this.coords.p_bar_x=this.toFixed(this.coords.p_from_fake+this.coords.p_handle/2),this.coords.p_bar_w=this.toFixed(this.coords.p_to_fake-this.coords.p_from_fake),this.result.from_percent=this.coords.p_from_real,this.result.from=this.convertToValue(this.coords.p_from_real),this.result.from_pretty=this._prettify(this.result.from),this.result.to_percent=this.coords.p_to_real,this.result.to=this.convertToValue(this.coords.p_to_real),this.result.to_pretty=this._prettify(this.result.to),this.options.values.length&&(this.result.from_value=this.options.values[this.result.from],this.result.to_value=this.options.values[this.result.to])),this.calcMinMax(),this.calcLabels()}},calcPointerPercent:function(){this.coords.w_rs?(this.coords.x_pointer<0||isNaN(this.coords.x_pointer)?this.coords.x_pointer=0:this.coords.x_pointer>this.coords.w_rs&&(this.coords.x_pointer=this.coords.w_rs),this.coords.p_pointer=this.toFixed(this.coords.x_pointer/this.coords.w_rs*100)):this.coords.p_pointer=0},convertToRealPercent:function(t){return t/(100-this.coords.p_handle)*100},convertToFakePercent:function(t){return t/100*(100-this.coords.p_handle)},getHandleX:function(){var t=100-this.coords.p_handle,i=this.toFixed(this.coords.p_pointer-this.coords.p_gap);return i<0?i=0:t<i&&(i=t),i},calcHandlePercent:function(){"single"===this.options.type?this.coords.w_handle=this.$cache.s_single.outerWidth(!1):this.coords.w_handle=this.$cache.s_from.outerWidth(!1),this.coords.p_handle=this.toFixed(this.coords.w_handle/this.coords.w_rs*100)},chooseHandle:function(t){return"single"===this.options.type?"single":this.coords.p_from_real+(this.coords.p_to_real-this.coords.p_from_real)/2<=t?this.options.to_fixed?"from":"to":this.options.from_fixed?"to":"from"},calcMinMax:function(){this.coords.w_rs&&(this.labels.p_min=this.labels.w_min/this.coords.w_rs*100,this.labels.p_max=this.labels.w_max/this.coords.w_rs*100)},calcLabels:function(){this.coords.w_rs&&!this.options.hide_from_to&&("single"===this.options.type?(this.labels.w_single=this.$cache.single.outerWidth(!1),this.labels.p_single_fake=this.labels.w_single/this.coords.w_rs*100,this.labels.p_single_left=this.coords.p_single_fake+this.coords.p_handle/2-this.labels.p_single_fake/2):(this.labels.w_from=this.$cache.from.outerWidth(!1),this.labels.p_from_fake=this.labels.w_from/this.coords.w_rs*100,this.labels.p_from_left=this.coords.p_from_fake+this.coords.p_handle/2-this.labels.p_from_fake/2,this.labels.p_from_left=this.toFixed(this.labels.p_from_left),this.labels.p_from_left=this.checkEdges(this.labels.p_from_left,this.labels.p_from_fake),this.labels.w_to=this.$cache.to.outerWidth(!1),this.labels.p_to_fake=this.labels.w_to/this.coords.w_rs*100,this.labels.p_to_left=this.coords.p_to_fake+this.coords.p_handle/2-this.labels.p_to_fake/2,this.labels.p_to_left=this.toFixed(this.labels.p_to_left),this.labels.p_to_left=this.checkEdges(this.labels.p_to_left,this.labels.p_to_fake),this.labels.w_single=this.$cache.single.outerWidth(!1),this.labels.p_single_fake=this.labels.w_single/this.coords.w_rs*100,this.labels.p_single_left=(this.labels.p_from_left+this.labels.p_to_left+this.labels.p_to_fake)/2-this.labels.p_single_fake/2,this.labels.p_single_left=this.toFixed(this.labels.p_single_left)),this.labels.p_single_left=this.checkEdges(this.labels.p_single_left,this.labels.p_single_fake))},updateScene:function(){this.raf_id&&(cancelAnimationFrame(this.raf_id),this.raf_id=null),clearTimeout(this.update_tm),this.update_tm=null,this.options&&(this.drawHandles(),this.is_active?this.raf_id=requestAnimationFrame(this.updateScene.bind(this)):this.update_tm=setTimeout(this.updateScene.bind(this),300))},drawHandles:function(){this.coords.w_rs=this.$cache.rs.outerWidth(!1),this.coords.w_rs&&(this.coords.w_rs!==this.coords.w_rs_old&&(this.target="base",this.is_resize=!0),(this.coords.w_rs!==this.coords.w_rs_old||this.force_redraw)&&(this.setMinMax(),this.calc(!0),this.drawLabels(),this.options.grid&&(this.calcGridMargin(),this.calcGridLabels()),this.force_redraw=!0,this.coords.w_rs_old=this.coords.w_rs,this.drawShadow()),this.coords.w_rs&&(this.dragging||this.force_redraw||this.is_key)&&((this.old_from!==this.result.from||this.old_to!==this.result.to||this.force_redraw||this.is_key)&&(this.drawLabels(),this.$cache.bar[0].style.left=this.coords.p_bar_x+"%",this.$cache.bar[0].style.width=this.coords.p_bar_w+"%","single"===this.options.type?(this.$cache.bar[0].style.left=0,this.$cache.bar[0].style.width=this.coords.p_bar_w+this.coords.p_bar_x+"%",this.$cache.s_single[0].style.left=this.coords.p_single_fake+"%"):(this.$cache.s_from[0].style.left=this.coords.p_from_fake+"%",this.$cache.s_to[0].style.left=this.coords.p_to_fake+"%",(this.old_from!==this.result.from||this.force_redraw)&&(this.$cache.from[0].style.left=this.labels.p_from_left+"%"),(this.old_to!==this.result.to||this.force_redraw)&&(this.$cache.to[0].style.left=this.labels.p_to_left+"%")),this.$cache.single[0].style.left=this.labels.p_single_left+"%",this.writeToInput(),this.old_from===this.result.from&&this.old_to===this.result.to||this.is_start||(this.$cache.input.trigger("change"),this.$cache.input.trigger("input")),this.old_from=this.result.from,this.old_to=this.result.to,this.is_resize||this.is_update||this.is_start||this.is_finish||this.callOnChange(),(this.is_key||this.is_click)&&(this.is_key=!1,this.is_click=!1,this.callOnFinish()),this.is_update=!1,this.is_resize=!1,this.is_finish=!1),this.is_start=!1,this.is_key=!1,this.is_click=!1,this.force_redraw=!1))},drawLabels:function(){if(this.options){var t,i,s,o,e,h=this.options.values.length,r=this.options.p_values;if(!this.options.hide_from_to)if("single"===this.options.type)t=h?this.decorate(r[this.result.from]):(o=this._prettify(this.result.from),this.decorate(o,this.result.from)),this.$cache.single.html(t),this.calcLabels(),this.labels.p_single_left<this.labels.p_min+1?this.$cache.min[0].style.visibility="hidden":this.$cache.min[0].style.visibility="visible",this.labels.p_single_left+this.labels.p_single_fake>100-this.labels.p_max-1?this.$cache.max[0].style.visibility="hidden":this.$cache.max[0].style.visibility="visible";else{s=h?(this.options.decorate_both?(t=this.decorate(r[this.result.from]),t+=this.options.values_separator,t+=this.decorate(r[this.result.to])):t=this.decorate(r[this.result.from]+this.options.values_separator+r[this.result.to]),i=this.decorate(r[this.result.from]),this.decorate(r[this.result.to])):(o=this._prettify(this.result.from),e=this._prettify(this.result.to),this.options.decorate_both?(t=this.decorate(o,this.result.from),t+=this.options.values_separator,t+=this.decorate(e,this.result.to)):t=this.decorate(o+this.options.values_separator+e,this.result.to),i=this.decorate(o,this.result.from),this.decorate(e,this.result.to)),this.$cache.single.html(t),this.$cache.from.html(i),this.$cache.to.html(s),this.calcLabels();var n=Math.min(this.labels.p_single_left,this.labels.p_from_left),a=this.labels.p_single_left+this.labels.p_single_fake,c=this.labels.p_to_left+this.labels.p_to_fake,l=Math.max(a,c);this.labels.p_from_left+this.labels.p_from_fake>=this.labels.p_to_left?(this.$cache.from[0].style.visibility="hidden",this.$cache.to[0].style.visibility="hidden",this.$cache.single[0].style.visibility="visible",l=this.result.from===this.result.to?("from"===this.target?this.$cache.from[0].style.visibility="visible":"to"===this.target?this.$cache.to[0].style.visibility="visible":this.target||(this.$cache.from[0].style.visibility="visible"),this.$cache.single[0].style.visibility="hidden",c):(this.$cache.from[0].style.visibility="hidden",this.$cache.to[0].style.visibility="hidden",this.$cache.single[0].style.visibility="visible",Math.max(a,c))):(this.$cache.from[0].style.visibility="visible",this.$cache.to[0].style.visibility="visible",this.$cache.single[0].style.visibility="hidden"),n<this.labels.p_min+1?this.$cache.min[0].style.visibility="hidden":this.$cache.min[0].style.visibility="visible",l>100-this.labels.p_max-1?this.$cache.max[0].style.visibility="hidden":this.$cache.max[0].style.visibility="visible"}}},drawShadow:function(){var t,i,s,o,e=this.options,h=this.$cache,r="number"==typeof e.from_min&&!isNaN(e.from_min),n="number"==typeof e.from_max&&!isNaN(e.from_max),a="number"==typeof e.to_min&&!isNaN(e.to_min),c="number"==typeof e.to_max&&!isNaN(e.to_max);"single"===e.type?e.from_shadow&&(r||n)?(t=this.convertToPercent(r?e.from_min:e.min),i=this.convertToPercent(n?e.from_max:e.max)-t,t=this.toFixed(t-this.coords.p_handle/100*t),i=this.toFixed(i-this.coords.p_handle/100*i),t+=this.coords.p_handle/2,h.shad_single[0].style.display="block",h.shad_single[0].style.left=t+"%",h.shad_single[0].style.width=i+"%"):h.shad_single[0].style.display="none":(e.from_shadow&&(r||n)?(t=this.convertToPercent(r?e.from_min:e.min),i=this.convertToPercent(n?e.from_max:e.max)-t,t=this.toFixed(t-this.coords.p_handle/100*t),i=this.toFixed(i-this.coords.p_handle/100*i),t+=this.coords.p_handle/2,h.shad_from[0].style.display="block",h.shad_from[0].style.left=t+"%",h.shad_from[0].style.width=i+"%"):h.shad_from[0].style.display="none",e.to_shadow&&(a||c)?(s=this.convertToPercent(a?e.to_min:e.min),o=this.convertToPercent(c?e.to_max:e.max)-s,s=this.toFixed(s-this.coords.p_handle/100*s),o=this.toFixed(o-this.coords.p_handle/100*o),s+=this.coords.p_handle/2,h.shad_to[0].style.display="block",h.shad_to[0].style.left=s+"%",h.shad_to[0].style.width=o+"%"):h.shad_to[0].style.display="none")},writeToInput:function(){"single"===this.options.type?(this.options.values.length?this.$cache.input.prop("value",this.result.from_value):this.$cache.input.prop("value",this.result.from),this.$cache.input.data("from",this.result.from)):(this.options.values.length?this.$cache.input.prop("value",this.result.from_value+this.options.input_values_separator+this.result.to_value):this.$cache.input.prop("value",this.result.from+this.options.input_values_separator+this.result.to),this.$cache.input.data("from",this.result.from),this.$cache.input.data("to",this.result.to))},callOnStart:function(){this.writeToInput(),this.options.onStart&&"function"==typeof this.options.onStart&&(this.options.scope?this.options.onStart.call(this.options.scope,this.result):this.options.onStart(this.result))},callOnChange:function(){this.writeToInput(),this.options.onChange&&"function"==typeof this.options.onChange&&(this.options.scope?this.options.onChange.call(this.options.scope,this.result):this.options.onChange(this.result))},callOnFinish:function(){this.writeToInput(),this.options.onFinish&&"function"==typeof this.options.onFinish&&(this.options.scope?this.options.onFinish.call(this.options.scope,this.result):this.options.onFinish(this.result))},callOnUpdate:function(){this.writeToInput(),this.options.onUpdate&&"function"==typeof this.options.onUpdate&&(this.options.scope?this.options.onUpdate.call(this.options.scope,this.result):this.options.onUpdate(this.result))},toggleInput:function(){this.$cache.input.toggleClass("irs-hidden-input"),this.has_tab_index?this.$cache.input.prop("tabindex",-1):this.$cache.input.removeProp("tabindex"),this.has_tab_index=!this.has_tab_index},convertToPercent:function(t,i){var s,o=this.options.max-this.options.min,e=o/100;return o?(s=(i?t:t-this.options.min)/e,this.toFixed(s)):(this.no_diapason=!0,0)},convertToValue:function(t){var i,s,o=this.options.min,e=this.options.max,h=o.toString().split(".")[1],r=e.toString().split(".")[1],n=0,a=0;if(0===t)return this.options.min;if(100===t)return this.options.max;h&&(n=i=h.length),r&&(n=s=r.length),i&&s&&(n=s<=i?i:s),o<0&&(o=+(o+(a=Math.abs(o))).toFixed(n),e=+(e+a).toFixed(n));var c,l=(e-o)/100*t+o,_=this.options.step.toString().split(".")[1];return l=_?+l.toFixed(_.length):(l/=this.options.step,+(l*=this.options.step).toFixed(0)),a&&(l-=a),(c=_?+l.toFixed(_.length):this.toFixed(l))<this.options.min?c=this.options.min:c>this.options.max&&(c=this.options.max),c},calcWithStep:function(t){var i=Math.round(t/this.coords.p_step)*this.coords.p_step;return 100<i&&(i=100),100===t&&(i=100),this.toFixed(i)},checkMinInterval:function(t,i,s){var o,e,h=this.options;return h.min_interval?(o=this.convertToValue(t),e=this.convertToValue(i),"from"===s?e-o<h.min_interval&&(o=e-h.min_interval):o-e<h.min_interval&&(o=e+h.min_interval),this.convertToPercent(o)):t},checkMaxInterval:function(t,i,s){var o,e,h=this.options;return h.max_interval?(o=this.convertToValue(t),e=this.convertToValue(i),"from"===s?e-o>h.max_interval&&(o=e-h.max_interval):o-e>h.max_interval&&(o=e+h.max_interval),this.convertToPercent(o)):t},checkDiapason:function(t,i,s){var o=this.convertToValue(t),e=this.options;return"number"!=typeof i&&(i=e.min),"number"!=typeof s&&(s=e.max),o<i&&(o=i),s<o&&(o=s),this.convertToPercent(o)},toFixed:function(t){return+(t=t.toFixed(20))},_prettify:function(t){return this.options.prettify_enabled?this.options.prettify&&"function"==typeof this.options.prettify?this.options.prettify(t):this.prettify(t):t},prettify:function(t){return t.toString().replace(/(\d{1,3}(?=(?:\d\d\d)+(?!\d)))/g,"$1"+this.options.prettify_separator)},checkEdges:function(t,i){return this.options.force_edges&&(t<0?t=0:100-i<t&&(t=100-i)),this.toFixed(t)},validate:function(){var t,i,s=this.options,o=this.result,e=s.values,h=e.length;if("string"==typeof s.min&&(s.min=+s.min),"string"==typeof s.max&&(s.max=+s.max),"string"==typeof s.from&&(s.from=+s.from),"string"==typeof s.to&&(s.to=+s.to),"string"==typeof s.step&&(s.step=+s.step),"string"==typeof s.from_min&&(s.from_min=+s.from_min),"string"==typeof s.from_max&&(s.from_max=+s.from_max),"string"==typeof s.to_min&&(s.to_min=+s.to_min),"string"==typeof s.to_max&&(s.to_max=+s.to_max),"string"==typeof s.grid_num&&(s.grid_num=+s.grid_num),s.max<s.min&&(s.max=s.min),h)for(s.p_values=[],s.min=0,s.max=h-1,s.step=1,s.grid_num=s.max,s.grid_snap=!0,i=0;i<h;i++)t=+e[i],t=isNaN(t)?e[i]:(e[i]=t,this._prettify(t)),s.p_values.push(t);("number"!=typeof s.from||isNaN(s.from))&&(s.from=s.min),("number"!=typeof s.to||isNaN(s.to))&&(s.to=s.max),"single"===s.type?(s.from<s.min&&(s.from=s.min),s.from>s.max&&(s.from=s.max)):(s.from<s.min&&(s.from=s.min),s.from>s.max&&(s.from=s.max),s.to<s.min&&(s.to=s.min),s.to>s.max&&(s.to=s.max),this.update_check.from&&(this.update_check.from!==s.from&&s.from>s.to&&(s.from=s.to),this.update_check.to!==s.to&&s.to<s.from&&(s.to=s.from)),s.from>s.to&&(s.from=s.to),s.to<s.from&&(s.to=s.from)),("number"!=typeof s.step||isNaN(s.step)||!s.step||s.step<0)&&(s.step=1),"number"==typeof s.from_min&&s.from<s.from_min&&(s.from=s.from_min),"number"==typeof s.from_max&&s.from>s.from_max&&(s.from=s.from_max),"number"==typeof s.to_min&&s.to<s.to_min&&(s.to=s.to_min),"number"==typeof s.to_max&&s.from>s.to_max&&(s.to=s.to_max),o&&(o.min!==s.min&&(o.min=s.min),o.max!==s.max&&(o.max=s.max),(o.from<o.min||o.from>o.max)&&(o.from=s.from),(o.to<o.min||o.to>o.max)&&(o.to=s.to)),("number"!=typeof s.min_interval||isNaN(s.min_interval)||!s.min_interval||s.min_interval<0)&&(s.min_interval=0),("number"!=typeof s.max_interval||isNaN(s.max_interval)||!s.max_interval||s.max_interval<0)&&(s.max_interval=0),s.min_interval&&s.min_interval>s.max-s.min&&(s.min_interval=s.max-s.min),s.max_interval&&s.max_interval>s.max-s.min&&(s.max_interval=s.max-s.min)},decorate:function(t,i){var s="",o=this.options;return o.prefix&&(s+=o.prefix),s+=t,o.max_postfix&&(o.values.length&&t===o.p_values[o.max]?(s+=o.max_postfix,o.postfix&&(s+=" ")):i===o.max&&(s+=o.max_postfix,o.postfix&&(s+=" "))),o.postfix&&(s+=o.postfix),s},updateFrom:function(){this.result.from=this.options.from,this.result.from_percent=this.convertToPercent(this.result.from),this.result.from_pretty=this._prettify(this.result.from),this.options.values&&(this.result.from_value=this.options.values[this.result.from])},updateTo:function(){this.result.to=this.options.to,this.result.to_percent=this.convertToPercent(this.result.to),this.result.to_pretty=this._prettify(this.result.to),this.options.values&&(this.result.to_value=this.options.values[this.result.to])},updateResult:function(){this.result.min=this.options.min,this.result.max=this.options.max,this.updateFrom(),this.updateTo()},appendGrid:function(){if(this.options.grid){var t,i,s,o,e,h,r=this.options,n=r.max-r.min,a=r.grid_num,c=0,l=4,_="";for(this.calcGridMargin(),r.grid_snap&&(a=n/r.step),50<a&&(a=50),s=this.toFixed(100/a),4<a&&(l=3),7<a&&(l=2),14<a&&(l=1),28<a&&(l=0),t=0;t<a+1;t++){for(o=l,100<(c=this.toFixed(s*t))&&(c=100),e=((this.coords.big[t]=c)-s*(t-1))/(o+1),i=1;i<=o&&0!==c;i++)_+='<span class="irs-grid-pol small" style="left: '+this.toFixed(c-e*i)+'%"></span>';_+='<span class="irs-grid-pol" style="left: '+c+'%"></span>',h=this.convertToValue(c),_+='<span class="irs-grid-text js-grid-text-'+t+'" style="left: '+c+'%">'+(h=r.values.length?r.p_values[h]:this._prettify(h))+"</span>"}this.coords.big_num=Math.ceil(a+1),this.$cache.cont.addClass("irs-with-grid"),this.$cache.grid.html(_),this.cacheGridLabels()}},cacheGridLabels:function(){var t,i,s=this.coords.big_num;for(i=0;i<s;i++)t=this.$cache.grid.find(".js-grid-text-"+i),this.$cache.grid_labels.push(t);this.calcGridLabels()},calcGridLabels:function(){var t,i,s=[],o=[],e=this.coords.big_num;for(t=0;t<e;t++)this.coords.big_w[t]=this.$cache.grid_labels[t].outerWidth(!1),this.coords.big_p[t]=this.toFixed(this.coords.big_w[t]/this.coords.w_rs*100),this.coords.big_x[t]=this.toFixed(this.coords.big_p[t]/2),s[t]=this.toFixed(this.coords.big[t]-this.coords.big_x[t]),o[t]=this.toFixed(s[t]+this.coords.big_p[t]);for(this.options.force_edges&&(s[0]<-this.coords.grid_gap&&(s[0]=-this.coords.grid_gap,o[0]=this.toFixed(s[0]+this.coords.big_p[0]),this.coords.big_x[0]=this.coords.grid_gap),o[e-1]>100+this.coords.grid_gap&&(o[e-1]=100+this.coords.grid_gap,s[e-1]=this.toFixed(o[e-1]-this.coords.big_p[e-1]),this.coords.big_x[e-1]=this.toFixed(this.coords.big_p[e-1]-this.coords.grid_gap))),this.calcGridCollision(2,s,o),this.calcGridCollision(4,s,o),t=0;t<e;t++)i=this.$cache.grid_labels[t][0],this.coords.big_x[t]!==Number.POSITIVE_INFINITY&&(i.style.marginLeft=-this.coords.big_x[t]+"%")},calcGridCollision:function(t,i,s){var o,e,h,r=this.coords.big_num;for(o=0;o<r&&!(r<=(e=o+t/2));o+=t)h=this.$cache.grid_labels[e][0],s[o]<=i[e]?h.style.visibility="visible":h.style.visibility="hidden"},calcGridMargin:function(){this.options.grid_margin&&(this.coords.w_rs=this.$cache.rs.outerWidth(!1),this.coords.w_rs&&("single"===this.options.type?this.coords.w_handle=this.$cache.s_single.outerWidth(!1):this.coords.w_handle=this.$cache.s_from.outerWidth(!1),this.coords.p_handle=this.toFixed(this.coords.w_handle/this.coords.w_rs*100),this.coords.grid_gap=this.toFixed(this.coords.p_handle/2-.1),this.$cache.grid[0].style.width=this.toFixed(100-this.coords.p_handle)+"%",this.$cache.grid[0].style.left=this.coords.grid_gap+"%"))},update:function(t){this.input&&(this.is_update=!0,this.options.from=this.result.from,this.options.to=this.result.to,this.update_check.from=this.result.from,this.update_check.to=this.result.to,this.options=a.extend(this.options,t),this.validate(),this.updateResult(t),this.toggleInput(),this.remove(),this.init(!0))},reset:function(){this.input&&(this.updateResult(),this.update())},destroy:function(){this.input&&(this.toggleInput(),this.$cache.input.prop("readonly",!1),a.data(this.input,"ionRangeSlider",null),this.remove(),this.input=null,this.options=null)}},a.fn.ionRangeSlider=function(t){return this.each(function(){a.data(this,"ionRangeSlider")||a.data(this,"ionRangeSlider",new h(this,t,o++))})},function(){for(var h=0,t=["ms","moz","webkit","o"],i=0;i<t.length&&!l.requestAnimationFrame;++i)l.requestAnimationFrame=l[t[i]+"RequestAnimationFrame"],l.cancelAnimationFrame=l[t[i]+"CancelAnimationFrame"]||l[t[i]+"CancelRequestAnimationFrame"];l.requestAnimationFrame||(l.requestAnimationFrame=function(t,i){var s=(new Date).getTime(),o=Math.max(0,16-(s-h)),e=l.setTimeout(function(){t(s+o)},o);return h=s+o,e}),l.cancelAnimationFrame||(l.cancelAnimationFrame=function(t){clearTimeout(t)})}()});
},{"jquery":2}],6:[function(require,module,exports){
/*!
* jquery.inputmask.bundle.js
* https://github.com/RobinHerbots/Inputmask
* Copyright (c) 2010 - 2018 Robin Herbots
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 4.0.0-beta.18
*/

!function(modules) {
    var installedModules = {};
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {
            i: moduleId,
            l: !1,
            exports: {}
        };
        return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__),
            module.l = !0, module.exports;
    }
    __webpack_require__.m = modules, __webpack_require__.c = installedModules, __webpack_require__.d = function(exports, name, getter) {
        __webpack_require__.o(exports, name) || Object.defineProperty(exports, name, {
            configurable: !1,
            enumerable: !0,
            get: getter
        });
    }, __webpack_require__.n = function(module) {
        var getter = module && module.__esModule ? function() {
            return module.default;
        } : function() {
            return module;
        };
        return __webpack_require__.d(getter, "a", getter), getter;
    }, __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }, __webpack_require__.p = "", __webpack_require__(__webpack_require__.s = 3);
}([ function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
    "function" == typeof Symbol && Symbol.iterator;
    factory = function($) {
        return $;
    }, __WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(2) ], void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory, _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    factory = function($, window, document, undefined) {
        var ua = navigator.userAgent, mobile = isInputEventSupported("touchstart"), iemobile = /iemobile/i.test(ua), iphone = /iphone/i.test(ua) && !iemobile;
        function Inputmask(alias, options, internal) {
            if (!(this instanceof Inputmask)) return new Inputmask(alias, options, internal);
            this.el = undefined, this.events = {}, this.maskset = undefined, this.refreshValue = !1,
            !0 !== internal && ($.isPlainObject(alias) ? options = alias : (options = options || {},
            alias && (options.alias = alias)), this.opts = $.extend(!0, {}, this.defaults, options),
                this.noMasksCache = options && options.definitions !== undefined, this.userOptions = options || {},
                this.isRTL = this.opts.numericInput, resolveAlias(this.opts.alias, options, this.opts));
        }
        function resolveAlias(aliasStr, options, opts) {
            var aliasDefinition = Inputmask.prototype.aliases[aliasStr];
            return aliasDefinition ? (aliasDefinition.alias && resolveAlias(aliasDefinition.alias, undefined, opts),
                $.extend(!0, opts, aliasDefinition), $.extend(!0, opts, options), !0) : (null === opts.mask && (opts.mask = aliasStr),
                !1);
        }
        function generateMaskSet(opts, nocache) {
            function generateMask(mask, metadata, opts) {
                var regexMask = !1;
                if (null !== mask && "" !== mask || ((regexMask = null !== opts.regex) ? mask = (mask = opts.regex).replace(/^(\^)(.*)(\$)$/, "$2") : (regexMask = !0,
                        mask = ".*")), 1 === mask.length && !1 === opts.greedy && 0 !== opts.repeat && (opts.placeholder = ""),
                    opts.repeat > 0 || "*" === opts.repeat || "+" === opts.repeat) {
                    var repeatStart = "*" === opts.repeat ? 0 : "+" === opts.repeat ? 1 : opts.repeat;
                    mask = opts.groupmarker[0] + mask + opts.groupmarker[1] + opts.quantifiermarker[0] + repeatStart + "," + opts.repeat + opts.quantifiermarker[1];
                }
                var masksetDefinition, maskdefKey = regexMask ? "regex_" + opts.regex : opts.numericInput ? mask.split("").reverse().join("") : mask;
                return Inputmask.prototype.masksCache[maskdefKey] === undefined || !0 === nocache ? (masksetDefinition = {
                    mask: mask,
                    maskToken: Inputmask.prototype.analyseMask(mask, regexMask, opts),
                    validPositions: {},
                    _buffer: undefined,
                    buffer: undefined,
                    tests: {},
                    excludes: {},
                    metadata: metadata,
                    maskLength: undefined
                }, !0 !== nocache && (Inputmask.prototype.masksCache[maskdefKey] = masksetDefinition,
                    masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[maskdefKey]))) : masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[maskdefKey]),
                    masksetDefinition;
            }
            if ($.isFunction(opts.mask) && (opts.mask = opts.mask(opts)), $.isArray(opts.mask)) {
                if (opts.mask.length > 1) {
                    if (null === opts.keepStatic) {
                        opts.keepStatic = "auto";
                        for (var i = 0; i < opts.mask.length; i++) if (opts.mask[i].charAt(0) !== opts.mask[0].charAt(0)) {
                            opts.keepStatic = !0;
                            break;
                        }
                    }
                    var altMask = opts.groupmarker[0];
                    return $.each(opts.isRTL ? opts.mask.reverse() : opts.mask, function(ndx, msk) {
                        altMask.length > 1 && (altMask += opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0]),
                            msk.mask === undefined || $.isFunction(msk.mask) ? altMask += msk : altMask += msk.mask;
                    }), generateMask(altMask += opts.groupmarker[1], opts.mask, opts);
                }
                opts.mask = opts.mask.pop();
            }
            return opts.mask && opts.mask.mask !== undefined && !$.isFunction(opts.mask.mask) ? generateMask(opts.mask.mask, opts.mask, opts) : generateMask(opts.mask, opts.mask, opts);
        }
        function isInputEventSupported(eventName) {
            var el = document.createElement("input"), evName = "on" + eventName, isSupported = evName in el;
            return isSupported || (el.setAttribute(evName, "return;"), isSupported = "function" == typeof el[evName]),
                el = null, isSupported;
        }
        function maskScope(actionObj, maskset, opts) {
            maskset = maskset || this.maskset, opts = opts || this.opts;
            var undoValue, $el, maxLength, colorMask, inputmask = this, el = this.el, isRTL = this.isRTL, skipKeyPressEvent = !1, skipInputEvent = !1, ignorable = !1, mouseEnter = !1, trackCaret = !1;
            function getMaskTemplate(baseOnInput, minimalPos, includeMode) {
                minimalPos = minimalPos || 0;
                var ndxIntlzr, test, testPos, maskTemplate = [], pos = 0, lvp = getLastValidPosition();
                do {
                    if (!0 === baseOnInput && getMaskSet().validPositions[pos]) test = (testPos = getMaskSet().validPositions[pos]).match,
                        ndxIntlzr = testPos.locator.slice(), maskTemplate.push(!0 === includeMode ? testPos.input : !1 === includeMode ? test.nativeDef : getPlaceholder(pos, test)); else {
                        test = (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1)).match, ndxIntlzr = testPos.locator.slice();
                        var jitMasking = !1 !== opts.jitMasking ? opts.jitMasking : test.jit;
                        (!1 === jitMasking || jitMasking === undefined || pos < lvp || "number" == typeof jitMasking && isFinite(jitMasking) && jitMasking > pos) && maskTemplate.push(!1 === includeMode ? test.nativeDef : getPlaceholder(pos, test));
                    }
                    "auto" === opts.keepStatic && test.newBlockMarker && null !== test.fn && (opts.keepStatic = pos - 1),
                        pos++;
                } while ((maxLength === undefined || pos < maxLength) && (null !== test.fn || "" !== test.def) || minimalPos > pos);
                return "" === maskTemplate[maskTemplate.length - 1] && maskTemplate.pop(), !1 === includeMode && getMaskSet().maskLength !== undefined || (getMaskSet().maskLength = pos - 1),
                    maskTemplate;
            }
            function getMaskSet() {
                return maskset;
            }
            function resetMaskSet(soft) {
                var maskset = getMaskSet();
                maskset.buffer = undefined, !0 !== soft && (maskset.validPositions = {}, maskset.p = 0);
            }
            function getLastValidPosition(closestTo, strict, validPositions) {
                var before = -1, after = -1, valids = validPositions || getMaskSet().validPositions;
                for (var posNdx in closestTo === undefined && (closestTo = -1), valids) {
                    var psNdx = parseInt(posNdx);
                    valids[psNdx] && (strict || !0 !== valids[psNdx].generatedInput) && (psNdx <= closestTo && (before = psNdx),
                    psNdx >= closestTo && (after = psNdx));
                }
                return -1 !== before && closestTo - before > 1 || after < closestTo ? before : after;
            }
            function stripValidPositions(start, end, nocheck, strict) {
                function IsEnclosedStatic(pos) {
                    var posMatch = getMaskSet().validPositions[pos];
                    if (posMatch !== undefined && null === posMatch.match.fn) {
                        var prevMatch = getMaskSet().validPositions[pos - 1], nextMatch = getMaskSet().validPositions[pos + 1];
                        return prevMatch !== undefined && nextMatch !== undefined;
                    }
                    return !1;
                }
                var i, startPos = start, positionsClone = $.extend(!0, {}, getMaskSet().validPositions), needsValidation = !1;
                for (getMaskSet().p = start, i = end - 1; i >= startPos; i--) getMaskSet().validPositions[i] !== undefined && (!0 !== nocheck && (!getMaskSet().validPositions[i].match.optionality && IsEnclosedStatic(i) || !1 === opts.canClearPosition(getMaskSet(), i, getLastValidPosition(undefined, !0), strict, opts)) || delete getMaskSet().validPositions[i]);
                for (resetMaskSet(!0), i = startPos + 1; i <= getLastValidPosition(); ) {
                    for (;getMaskSet().validPositions[startPos] !== undefined; ) startPos++;
                    if (i < startPos && (i = startPos + 1), getMaskSet().validPositions[i] === undefined && isMask(i)) i++; else {
                        var t = getTestTemplate(i);
                        !1 === needsValidation && positionsClone[startPos] && positionsClone[startPos].match.def === t.match.def ? (getMaskSet().validPositions[startPos] = $.extend(!0, {}, positionsClone[startPos]),
                            getMaskSet().validPositions[startPos].input = t.input, delete getMaskSet().validPositions[i],
                            i++) : positionCanMatchDefinition(startPos, t.match.def) ? !1 !== isValid(startPos, t.input || getPlaceholder(i), !0) && (delete getMaskSet().validPositions[i],
                            i++, needsValidation = !0) : isMask(i) || (i++, startPos--), startPos++;
                    }
                }
                if (!0 !== strict) for (i = getLastValidPosition(-1, !0); getMaskSet().validPositions[i] && !0 === getMaskSet().validPositions[i].generatedInput; ) delete getMaskSet().validPositions[i--];
                resetMaskSet(!0);
            }
            function determineTestTemplate(pos, tests, guessNextBest) {
                for (var testPos, altTest = getTest(pos = pos > 0 ? pos - 1 : 0, tests), altArr = altTest.alternation !== undefined ? altTest.locator[altTest.alternation].toString().split(",") : [], ndx = 0; ndx < tests.length && (!((testPos = tests[ndx]).match && (opts.greedy && !0 !== testPos.match.optionalQuantifier || (!1 === testPos.match.optionality || !1 === testPos.match.newBlockMarker) && !0 !== testPos.match.optionalQuantifier) && (altTest.alternation === undefined || altTest.alternation !== testPos.alternation || testPos.locator[altTest.alternation] !== undefined && checkAlternationMatch(testPos.locator[altTest.alternation].toString().split(","), altArr))) || !0 === guessNextBest && (null !== testPos.match.fn || /[0-9a-bA-Z]/.test(testPos.match.def))); ndx++) ;
                return testPos;
            }
            function getDecisionTaker(tst) {
                var decisionTaker = tst.locator[tst.alternation];
                return "string" == typeof decisionTaker && decisionTaker.length > 0 && (decisionTaker = decisionTaker.split(",")[0]),
                    decisionTaker !== undefined ? decisionTaker.toString() : "";
            }
            function getLocator(tst, align) {
                for (var locator = (tst.alternation != undefined ? tst.mloc[getDecisionTaker(tst)] : tst.locator).join(""); locator.length < align; ) locator += "0";
                return locator;
            }
            function getTestTemplate(pos, ndxIntlzr, tstPs) {
                return getMaskSet().validPositions[pos] || determineTestTemplate(pos, getTests(pos, ndxIntlzr ? ndxIntlzr.slice() : ndxIntlzr, tstPs));
            }
            function getTest(pos, tests) {
                return getMaskSet().validPositions[pos] ? getMaskSet().validPositions[pos] : (tests || getTests(pos))[0];
            }
            function positionCanMatchDefinition(pos, def) {
                for (var valid = !1, tests = getTests(pos), tndx = 0; tndx < tests.length; tndx++) if (tests[tndx].match && tests[tndx].match.def === def) {
                    valid = !0;
                    break;
                }
                return valid;
            }
            function getTests(pos, ndxIntlzr, tstPs) {
                var latestMatch, maskTokens = getMaskSet().maskToken, testPos = ndxIntlzr ? tstPs : 0, ndxInitializer = ndxIntlzr ? ndxIntlzr.slice() : [ 0 ], matches = [], insertStop = !1, cacheDependency = ndxIntlzr ? ndxIntlzr.join("") : "";
                function resolveTestFromToken(maskToken, ndxInitializer, loopNdx, quantifierRecurse) {
                    function handleMatch(match, loopNdx, quantifierRecurse) {
                        function isFirstMatch(latestMatch, tokenGroup) {
                            var firstMatch = 0 === $.inArray(latestMatch, tokenGroup.matches);
                            return firstMatch || $.each(tokenGroup.matches, function(ndx, match) {
                                if (!0 === match.isQuantifier ? firstMatch = isFirstMatch(latestMatch, tokenGroup.matches[ndx - 1]) : !0 === match.isOptional ? firstMatch = isFirstMatch(latestMatch, match) : !0 === match.isAlternate && (firstMatch = isFirstMatch(latestMatch, match)),
                                        firstMatch) return !1;
                            }), firstMatch;
                        }
                        function resolveNdxInitializer(pos, alternateNdx, targetAlternation) {
                            var bestMatch, indexPos;
                            if ((getMaskSet().tests[pos] || getMaskSet().validPositions[pos]) && $.each(getMaskSet().tests[pos] || [ getMaskSet().validPositions[pos] ], function(ndx, lmnt) {
                                    if (lmnt.mloc[alternateNdx]) return bestMatch = lmnt, !1;
                                    var alternation = targetAlternation !== undefined ? targetAlternation : lmnt.alternation, ndxPos = lmnt.locator[alternation] !== undefined ? lmnt.locator[alternation].toString().indexOf(alternateNdx) : -1;
                                    (indexPos === undefined || ndxPos < indexPos) && -1 !== ndxPos && (bestMatch = lmnt,
                                        indexPos = ndxPos);
                                }), bestMatch) {
                                var bestMatchAltIndex = bestMatch.locator[bestMatch.alternation];
                                return (bestMatch.mloc[alternateNdx] || bestMatch.mloc[bestMatchAltIndex] || bestMatch.locator).slice((targetAlternation !== undefined ? targetAlternation : bestMatch.alternation) + 1);
                            }
                            return targetAlternation !== undefined ? resolveNdxInitializer(pos, alternateNdx) : undefined;
                        }
                        function isSubsetOf(source, target) {
                            function expand(pattern) {
                                for (var start, end, expanded = [], i = 0, l = pattern.length; i < l; i++) if ("-" === pattern.charAt(i)) for (end = pattern.charCodeAt(i + 1); ++start < end; ) expanded.push(String.fromCharCode(start)); else start = pattern.charCodeAt(i),
                                    expanded.push(pattern.charAt(i));
                                return expanded.join("");
                            }
                            return opts.regex && null !== source.match.fn && null !== target.match.fn ? -1 !== expand(target.match.def.replace(/[\[\]]/g, "")).indexOf(expand(source.match.def.replace(/[\[\]]/g, ""))) : source.match.def === target.match.nativeDef;
                        }
                        function setMergeLocators(targetMatch, altMatch) {
                            if (altMatch === undefined || targetMatch.alternation === altMatch.alternation && -1 === targetMatch.locator[targetMatch.alternation].toString().indexOf(altMatch.locator[altMatch.alternation])) {
                                targetMatch.mloc = targetMatch.mloc || {};
                                var locNdx = targetMatch.locator[targetMatch.alternation];
                                if (locNdx !== undefined) {
                                    if ("string" == typeof locNdx && (locNdx = locNdx.split(",")[0]), targetMatch.mloc[locNdx] === undefined && (targetMatch.mloc[locNdx] = targetMatch.locator.slice()),
                                        altMatch !== undefined) {
                                        for (var ndx in altMatch.mloc) "string" == typeof ndx && (ndx = ndx.split(",")[0]),
                                        targetMatch.mloc[ndx] === undefined && (targetMatch.mloc[ndx] = altMatch.mloc[ndx]);
                                        targetMatch.locator[targetMatch.alternation] = Object.keys(targetMatch.mloc).join(",");
                                    }
                                    return !0;
                                }
                                targetMatch.alternation = undefined;
                            }
                            return !1;
                        }
                        if (testPos > 5e3) throw "Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. " + getMaskSet().mask;
                        if (testPos === pos && match.matches === undefined) return matches.push({
                            match: match,
                            locator: loopNdx.reverse(),
                            cd: cacheDependency,
                            mloc: {}
                        }), !0;
                        if (match.matches !== undefined) {
                            if (match.isGroup && quantifierRecurse !== match) {
                                if (match = handleMatch(maskToken.matches[$.inArray(match, maskToken.matches) + 1], loopNdx)) return !0;
                            } else if (match.isOptional) {
                                var optionalToken = match;
                                if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) {
                                    if (latestMatch = matches[matches.length - 1].match, quantifierRecurse !== undefined || !isFirstMatch(latestMatch, optionalToken)) return !0;
                                    insertStop = !0, testPos = pos;
                                }
                            } else if (match.isAlternator) {
                                var maltMatches, alternateToken = match, malternateMatches = [], currentMatches = matches.slice(), loopNdxCnt = loopNdx.length, altIndex = ndxInitializer.length > 0 ? ndxInitializer.shift() : -1;
                                if (-1 === altIndex || "string" == typeof altIndex) {
                                    var amndx, currentPos = testPos, ndxInitializerClone = ndxInitializer.slice(), altIndexArr = [];
                                    if ("string" == typeof altIndex) altIndexArr = altIndex.split(","); else for (amndx = 0; amndx < alternateToken.matches.length; amndx++) altIndexArr.push(amndx.toString());
                                    if (getMaskSet().excludes[pos]) {
                                        for (var altIndexArrClone = altIndexArr.slice(), i = 0, el = getMaskSet().excludes[pos].length; i < el; i++) altIndexArr.splice(altIndexArr.indexOf(getMaskSet().excludes[pos][i].toString()), 1);
                                        0 === altIndexArr.length && (getMaskSet().excludes[pos] = undefined, altIndexArr = altIndexArrClone);
                                    }
                                    (!0 === opts.keepStatic || isFinite(parseInt(opts.keepStatic)) && currentPos >= opts.keepStatic) && (altIndexArr = altIndexArr.slice(0, 1));
                                    for (var ndx = 0; ndx < altIndexArr.length; ndx++) {
                                        amndx = parseInt(altIndexArr[ndx]), matches = [], ndxInitializer = resolveNdxInitializer(testPos, amndx, loopNdxCnt) || ndxInitializerClone.slice(),
                                        alternateToken.matches[amndx] && handleMatch(alternateToken.matches[amndx], [ amndx ].concat(loopNdx), quantifierRecurse) && (match = !0),
                                            maltMatches = matches.slice(), testPos = currentPos, matches = [];
                                        for (var ndx1 = 0; ndx1 < maltMatches.length; ndx1++) {
                                            var altMatch = maltMatches[ndx1], dropMatch = !1;
                                            altMatch.alternation = altMatch.alternation || loopNdxCnt, setMergeLocators(altMatch);
                                            for (var ndx2 = 0; ndx2 < malternateMatches.length; ndx2++) {
                                                var altMatch2 = malternateMatches[ndx2];
                                                if ("string" != typeof altIndex || altMatch.alternation !== undefined && -1 !== $.inArray(altMatch.locator[altMatch.alternation].toString(), altIndexArr)) {
                                                    if (altMatch.match.nativeDef === altMatch2.match.nativeDef) {
                                                        dropMatch = !0, setMergeLocators(altMatch2, altMatch);
                                                        break;
                                                    }
                                                    if (isSubsetOf(altMatch, altMatch2)) {
                                                        setMergeLocators(altMatch, altMatch2) && (dropMatch = !0, malternateMatches.splice(malternateMatches.indexOf(altMatch2), 0, altMatch));
                                                        break;
                                                    }
                                                    if (isSubsetOf(altMatch2, altMatch)) {
                                                        setMergeLocators(altMatch2, altMatch);
                                                        break;
                                                    }
                                                    if (target = altMatch2, null === (source = altMatch).match.fn && null !== target.match.fn && target.match.fn.test(source.match.def, getMaskSet(), pos, !1, opts, !1)) {
                                                        setMergeLocators(altMatch, altMatch2) && (dropMatch = !0, malternateMatches.splice(malternateMatches.indexOf(altMatch2), 0, altMatch));
                                                        break;
                                                    }
                                                }
                                            }
                                            dropMatch || malternateMatches.push(altMatch);
                                        }
                                    }
                                    matches = currentMatches.concat(malternateMatches), testPos = pos, insertStop = matches.length > 0,
                                        match = malternateMatches.length > 0, ndxInitializer = ndxInitializerClone.slice();
                                } else match = handleMatch(alternateToken.matches[altIndex] || maskToken.matches[altIndex], [ altIndex ].concat(loopNdx), quantifierRecurse);
                                if (match) return !0;
                            } else if (match.isQuantifier && quantifierRecurse !== maskToken.matches[$.inArray(match, maskToken.matches) - 1]) for (var qt = match, qndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; qndx < (isNaN(qt.quantifier.max) ? qndx + 1 : qt.quantifier.max) && testPos <= pos; qndx++) {
                                var tokenGroup = maskToken.matches[$.inArray(qt, maskToken.matches) - 1];
                                if (match = handleMatch(tokenGroup, [ qndx ].concat(loopNdx), tokenGroup)) {
                                    if ((latestMatch = matches[matches.length - 1].match).optionalQuantifier = qndx > qt.quantifier.min - 1,
                                            latestMatch.jit = qndx + tokenGroup.matches.indexOf(latestMatch) >= qt.quantifier.jit,
                                        isFirstMatch(latestMatch, tokenGroup) && qndx > qt.quantifier.min - 1) {
                                        insertStop = !0, testPos = pos;
                                        break;
                                    }
                                    if (qt.quantifier.jit !== undefined && isNaN(qt.quantifier.max) && latestMatch.optionalQuantifier && getMaskSet().validPositions[pos - 1] === undefined) {
                                        matches.pop(), insertStop = !0, testPos = pos, cacheDependency = undefined;
                                        break;
                                    }
                                    return !0;
                                }
                            } else if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) return !0;
                        } else testPos++;
                        var source, target;
                    }
                    for (var tndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; tndx < maskToken.matches.length; tndx++) if (!0 !== maskToken.matches[tndx].isQuantifier) {
                        var match = handleMatch(maskToken.matches[tndx], [ tndx ].concat(loopNdx), quantifierRecurse);
                        if (match && testPos === pos) return match;
                        if (testPos > pos) break;
                    }
                }
                if (pos > -1) {
                    if (ndxIntlzr === undefined) {
                        for (var test, previousPos = pos - 1; (test = getMaskSet().validPositions[previousPos] || getMaskSet().tests[previousPos]) === undefined && previousPos > -1; ) previousPos--;
                        test !== undefined && previousPos > -1 && (ndxInitializer = function(pos, tests) {
                            var locator = [];
                            return $.isArray(tests) || (tests = [ tests ]), tests.length > 0 && (tests[0].alternation === undefined ? 0 === (locator = determineTestTemplate(pos, tests.slice()).locator.slice()).length && (locator = tests[0].locator.slice()) : $.each(tests, function(ndx, tst) {
                                if ("" !== tst.def) if (0 === locator.length) locator = tst.locator.slice(); else for (var i = 0; i < locator.length; i++) tst.locator[i] && -1 === locator[i].toString().indexOf(tst.locator[i]) && (locator[i] += "," + tst.locator[i]);
                            })), locator;
                        }(previousPos, test), cacheDependency = ndxInitializer.join(""), testPos = previousPos);
                    }
                    if (getMaskSet().tests[pos] && getMaskSet().tests[pos][0].cd === cacheDependency) return getMaskSet().tests[pos];
                    for (var mtndx = ndxInitializer.shift(); mtndx < maskTokens.length; mtndx++) {
                        if (resolveTestFromToken(maskTokens[mtndx], ndxInitializer, [ mtndx ]) && testPos === pos || testPos > pos) break;
                    }
                }
                return (0 === matches.length || insertStop) && matches.push({
                    match: {
                        fn: null,
                        optionality: !0,
                        casing: null,
                        def: "",
                        placeholder: ""
                    },
                    locator: [],
                    mloc: {},
                    cd: cacheDependency
                }), ndxIntlzr !== undefined && getMaskSet().tests[pos] ? $.extend(!0, [], matches) : (getMaskSet().tests[pos] = $.extend(!0, [], matches),
                    getMaskSet().tests[pos]);
            }
            function getBufferTemplate() {
                return getMaskSet()._buffer === undefined && (getMaskSet()._buffer = getMaskTemplate(!1, 1),
                getMaskSet().buffer === undefined && (getMaskSet().buffer = getMaskSet()._buffer.slice())),
                    getMaskSet()._buffer;
            }
            function getBuffer(noCache) {
                return getMaskSet().buffer !== undefined && !0 !== noCache || (getMaskSet().buffer = getMaskTemplate(!0, getLastValidPosition(), !0)),
                    getMaskSet().buffer;
            }
            function refreshFromBuffer(start, end, buffer) {
                var i, p;
                if (!0 === start) resetMaskSet(), start = 0, end = buffer.length; else for (i = start; i < end; i++) delete getMaskSet().validPositions[i];
                for (p = start, i = start; i < end; i++) if (resetMaskSet(!0), buffer[i] !== opts.skipOptionalPartCharacter) {
                    var valResult = isValid(p, buffer[i], !0, !0);
                    !1 !== valResult && (resetMaskSet(!0), p = valResult.caret !== undefined ? valResult.caret : valResult.pos + 1);
                }
            }
            function checkAlternationMatch(altArr1, altArr2, na) {
                for (var naNdx, altArrC = opts.greedy ? altArr2 : altArr2.slice(0, 1), isMatch = !1, naArr = na !== undefined ? na.split(",") : [], i = 0; i < naArr.length; i++) -1 !== (naNdx = altArr1.indexOf(naArr[i])) && altArr1.splice(naNdx, 1);
                for (var alndx = 0; alndx < altArr1.length; alndx++) if (-1 !== $.inArray(altArr1[alndx], altArrC)) {
                    isMatch = !0;
                    break;
                }
                return isMatch;
            }
            function alternate(pos, c, strict, fromSetValid, rAltPos) {
                var lastAlt, alternation, altPos, prevAltPos, i, validPos, decisionPos, validPsClone = $.extend(!0, {}, getMaskSet().validPositions), isValidRslt = !1, lAltPos = rAltPos !== undefined ? rAltPos : getLastValidPosition();
                if (-1 === lAltPos && rAltPos === undefined) alternation = (prevAltPos = getTest(lastAlt = 0)).alternation; else for (;lAltPos >= 0; lAltPos--) if ((altPos = getMaskSet().validPositions[lAltPos]) && altPos.alternation !== undefined) {
                    if (prevAltPos && prevAltPos.locator[altPos.alternation] !== altPos.locator[altPos.alternation]) break;
                    lastAlt = lAltPos, alternation = getMaskSet().validPositions[lastAlt].alternation,
                        prevAltPos = altPos;
                }
                if (alternation !== undefined) {
                    decisionPos = parseInt(lastAlt), getMaskSet().excludes[decisionPos] = getMaskSet().excludes[decisionPos] || [],
                    !0 !== pos && getMaskSet().excludes[decisionPos].push(getDecisionTaker(prevAltPos));
                    var validInputsClone = [], staticInputsBeforePos = 0;
                    for (i = decisionPos; i < getLastValidPosition(undefined, !0) + 1; i++) (validPos = getMaskSet().validPositions[i]) && !0 !== validPos.generatedInput && /[0-9a-bA-Z]/.test(validPos.input) ? validInputsClone.push(validPos.input) : i < pos && staticInputsBeforePos++,
                        delete getMaskSet().validPositions[i];
                    for (;getMaskSet().excludes[decisionPos] && getMaskSet().excludes[decisionPos].length < 10; ) {
                        var posOffset = -1 * staticInputsBeforePos, validInputs = validInputsClone.slice();
                        for (getMaskSet().tests[decisionPos] = undefined, resetMaskSet(!0), isValidRslt = !0; validInputs.length > 0; ) {
                            var input = validInputs.shift();
                            if (input !== opts.skipOptionalPartCharacter && !(isValidRslt = isValid(getLastValidPosition(undefined, !0) + 1, input, !1, fromSetValid, !0))) break;
                        }
                        if (isValidRslt && c !== undefined) {
                            var targetLvp = getLastValidPosition(pos) + 1;
                            for (i = decisionPos; i < getLastValidPosition() + 1; i++) ((validPos = getMaskSet().validPositions[i]) === undefined || null == validPos.match.fn) && i < pos + posOffset && posOffset++;
                            isValidRslt = isValid((pos += posOffset) > targetLvp ? targetLvp : pos, c, strict, fromSetValid, !0);
                        }
                        if (isValidRslt) break;
                        if (resetMaskSet(), prevAltPos = getTest(decisionPos), getMaskSet().validPositions = $.extend(!0, {}, validPsClone),
                                !getMaskSet().excludes[decisionPos]) {
                            isValidRslt = alternate(pos, c, strict, fromSetValid, decisionPos - 1);
                            break;
                        }
                        var decisionTaker = getDecisionTaker(prevAltPos);
                        if (-1 !== getMaskSet().excludes[decisionPos].indexOf(decisionTaker)) {
                            isValidRslt = alternate(pos, c, strict, fromSetValid, decisionPos - 1);
                            break;
                        }
                        for (getMaskSet().excludes[decisionPos].push(decisionTaker), i = decisionPos; i < getLastValidPosition(undefined, !0) + 1; i++) delete getMaskSet().validPositions[i];
                    }
                }
                return getMaskSet().excludes[decisionPos] = undefined, isValidRslt;
            }
            function isValid(pos, c, strict, fromSetValid, fromAlternate, validateOnly) {
                function isSelection(posObj) {
                    return isRTL ? posObj.begin - posObj.end > 1 || posObj.begin - posObj.end == 1 : posObj.end - posObj.begin > 1 || posObj.end - posObj.begin == 1;
                }
                strict = !0 === strict;
                var maskPos = pos;
                function _isValid(position, c, strict) {
                    var rslt = !1;
                    return $.each(getTests(position), function(ndx, tst) {
                        var test = tst.match;
                        if (getBuffer(!0), !1 !== (rslt = null != test.fn ? test.fn.test(c, getMaskSet(), position, strict, opts, isSelection(pos)) : (c === test.def || c === opts.skipOptionalPartCharacter) && "" !== test.def && {
                                c: getPlaceholder(position, test, !0) || test.def,
                                pos: position
                            })) {
                            var elem = rslt.c !== undefined ? rslt.c : c;
                            elem = elem === opts.skipOptionalPartCharacter && null === test.fn ? getPlaceholder(position, test, !0) || test.def : elem;
                            var validatedPos = position, possibleModifiedBuffer = getBuffer();
                            if (rslt.remove !== undefined && ($.isArray(rslt.remove) || (rslt.remove = [ rslt.remove ]),
                                    $.each(rslt.remove.sort(function(a, b) {
                                        return b - a;
                                    }), function(ndx, lmnt) {
                                        stripValidPositions(lmnt, lmnt + 1, !0);
                                    })), rslt.insert !== undefined && ($.isArray(rslt.insert) || (rslt.insert = [ rslt.insert ]),
                                    $.each(rslt.insert.sort(function(a, b) {
                                        return a - b;
                                    }), function(ndx, lmnt) {
                                        isValid(lmnt.pos, lmnt.c, !0, fromSetValid);
                                    })), rslt.refreshFromBuffer) {
                                var refresh = rslt.refreshFromBuffer;
                                if (refreshFromBuffer(!0 === refresh ? refresh : refresh.start, refresh.end, possibleModifiedBuffer),
                                    rslt.pos === undefined && rslt.c === undefined) return rslt.pos = getLastValidPosition(),
                                    !1;
                                if ((validatedPos = rslt.pos !== undefined ? rslt.pos : position) !== position) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0, fromSetValid)),
                                    !1;
                            } else if (!0 !== rslt && rslt.pos !== undefined && rslt.pos !== position && (validatedPos = rslt.pos,
                                    refreshFromBuffer(position, validatedPos, getBuffer().slice()), validatedPos !== position)) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0)),
                                !1;
                            return (!0 === rslt || rslt.pos !== undefined || rslt.c !== undefined) && (ndx > 0 && resetMaskSet(!0),
                            setValidPosition(validatedPos, $.extend({}, tst, {
                                input: function(elem, test, pos) {
                                    switch (opts.casing || test.casing) {
                                        case "upper":
                                            elem = elem.toUpperCase();
                                            break;

                                        case "lower":
                                            elem = elem.toLowerCase();
                                            break;

                                        case "title":
                                            var posBefore = getMaskSet().validPositions[pos - 1];
                                            elem = 0 === pos || posBefore && posBefore.input === String.fromCharCode(Inputmask.keyCode.SPACE) ? elem.toUpperCase() : elem.toLowerCase();
                                            break;

                                        default:
                                            if ($.isFunction(opts.casing)) {
                                                var args = Array.prototype.slice.call(arguments);
                                                args.push(getMaskSet().validPositions), elem = opts.casing.apply(this, args);
                                            }
                                    }
                                    return elem;
                                }(elem, test, validatedPos)
                            }), fromSetValid, isSelection(pos)) || (rslt = !1), !1);
                        }
                    }), rslt;
                }
                function trackbackPositions(originalPos, newPos, fillOnly) {
                    var result;
                    if (originalPos === undefined) for (originalPos = newPos - 1; originalPos > 0 && !getMaskSet().validPositions[originalPos]; originalPos--) ;
                    for (var ps = originalPos; ps < newPos; ps++) if (getMaskSet().validPositions[ps] === undefined && !isMask(ps, !0)) {
                        var vp = 0 == ps ? getTest(ps) : getMaskSet().validPositions[ps - 1];
                        if (vp) {
                            var tstLocator, targetLocator = getLocator(vp), tests = getTests(ps).slice(), closest = undefined, bestMatch = getTest(ps);
                            if ("" === tests[tests.length - 1].match.def && tests.pop(), $.each(tests, function(ndx, tst) {
                                    tstLocator = getLocator(tst, targetLocator.length);
                                    var distance = Math.abs(tstLocator - targetLocator);
                                    (closest === undefined || distance < closest) && null === tst.match.fn && !0 !== tst.match.optionality && !0 !== tst.match.optionalQuantifier && (closest = distance,
                                        bestMatch = tst);
                                }), (bestMatch = $.extend({}, bestMatch, {
                                    input: getPlaceholder(ps, bestMatch.match, !0) || bestMatch.match.def
                                })).generatedInput = !0, setValidPosition(ps, bestMatch, !0), !0 !== fillOnly) {
                                var cvpInput = getMaskSet().validPositions[newPos].input;
                                getMaskSet().validPositions[newPos] = undefined, result = isValid(newPos, cvpInput, !0, !0);
                            }
                        }
                    }
                    return result;
                }
                function setValidPosition(pos, validTest, fromSetValid, isSelection) {
                    if (isSelection || opts.insertMode && getMaskSet().validPositions[pos] !== undefined && fromSetValid === undefined) {
                        var i, positionsClone = $.extend(!0, {}, getMaskSet().validPositions), lvp = getLastValidPosition(undefined, !0);
                        for (i = pos; i <= lvp; i++) delete getMaskSet().validPositions[i];
                        getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);
                        var j, valid = !0, vps = getMaskSet().validPositions, needsValidation = !1;
                        for (i = j = pos; i <= lvp; i++) {
                            var t = positionsClone[i];
                            if (t !== undefined) for (var posMatch = j; "" !== getTest(posMatch).match.def && (null === t.match.fn && vps[i] && (!0 === vps[i].match.optionalQuantifier || !0 === vps[i].match.optionality) || null != t.match.fn); ) {
                                if (posMatch++, !1 === needsValidation && positionsClone[posMatch] && positionsClone[posMatch].match.def === t.match.def) getMaskSet().validPositions[posMatch] = $.extend(!0, {}, positionsClone[posMatch]),
                                    getMaskSet().validPositions[posMatch].input = t.input, trackbackPositions(undefined, posMatch, !0),
                                    j = posMatch, valid = !0; else if (positionCanMatchDefinition(posMatch, t.match.def)) {
                                    var result = isValid(posMatch, t.input, !0, !0);
                                    valid = !1 !== result, j = result.caret || result.insert ? getLastValidPosition() : posMatch,
                                        needsValidation = !0;
                                } else if (!(valid = !0 === t.generatedInput) && "" === getTest(posMatch).match.def) break;
                                if (valid) break;
                            }
                            if (!valid) break;
                        }
                        if (!valid) return getMaskSet().validPositions = $.extend(!0, {}, positionsClone),
                            resetMaskSet(!0), !1;
                    } else getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);
                    return resetMaskSet(!0), !0;
                }
                pos.begin !== undefined && (maskPos = isRTL && !isSelection(pos) ? pos.end : pos.begin);
                var result = !0, positionsClone = $.extend(!0, {}, getMaskSet().validPositions);
                if ($.isFunction(opts.preValidation) && !strict && !0 !== fromSetValid && !0 !== validateOnly && (result = opts.preValidation(getBuffer(), maskPos, c, isSelection(pos), opts, getMaskSet())),
                    !0 === result) {
                    if (trackbackPositions(undefined, maskPos, !0), isSelection(pos) && (handleRemove(undefined, Inputmask.keyCode.DELETE, pos, !0, !0),
                            maskPos = getMaskSet().p), (maxLength === undefined || maskPos < maxLength) && (result = _isValid(maskPos, c, strict),
                        (!strict || !0 === fromSetValid) && !1 === result && !0 !== validateOnly)) {
                        var currentPosValid = getMaskSet().validPositions[maskPos];
                        if (!currentPosValid || null !== currentPosValid.match.fn || currentPosValid.match.def !== c && c !== opts.skipOptionalPartCharacter) {
                            if ((opts.insertMode || getMaskSet().validPositions[seekNext(maskPos)] === undefined) && !isMask(maskPos, !0)) for (var nPos = maskPos + 1, snPos = seekNext(maskPos); nPos <= snPos; nPos++) if (!1 !== (result = _isValid(nPos, c, strict))) {
                                result = trackbackPositions(maskPos, result.pos !== undefined ? result.pos : nPos) || result,
                                    maskPos = nPos;
                                break;
                            }
                        } else result = {
                            caret: seekNext(maskPos)
                        };
                    }
                    !1 !== result || null === opts.keepStatic || !1 === opts.keepStatic || strict || !0 === fromAlternate || (result = alternate(maskPos, c, strict, fromSetValid)),
                    !0 === result && (result = {
                        pos: maskPos
                    });
                }
                if ($.isFunction(opts.postValidation) && !1 !== result && !strict && !0 !== fromSetValid && !0 !== validateOnly) {
                    var postResult = opts.postValidation(getBuffer(!0), result, opts);
                    if (postResult !== undefined) {
                        if (postResult.refreshFromBuffer && postResult.buffer) {
                            var refresh = postResult.refreshFromBuffer;
                            refreshFromBuffer(!0 === refresh ? refresh : refresh.start, refresh.end, postResult.buffer);
                        }
                        result = !0 === postResult ? result : postResult;
                    }
                }
                return result && result.pos === undefined && (result.pos = maskPos), !1 !== result && !0 !== validateOnly || (resetMaskSet(!0),
                    getMaskSet().validPositions = $.extend(!0, {}, positionsClone)), result;
            }
            function isMask(pos, strict) {
                var test = getTestTemplate(pos).match;
                if ("" === test.def && (test = getTest(pos).match), null != test.fn) return test.fn;
                if (!0 !== strict && pos > -1) {
                    var tests = getTests(pos);
                    return tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0);
                }
                return !1;
            }
            function seekNext(pos, newBlock) {
                for (var position = pos + 1; "" !== getTest(position).match.def && (!0 === newBlock && (!0 !== getTest(position).match.newBlockMarker || !isMask(position)) || !0 !== newBlock && !isMask(position)); ) position++;
                return position;
            }
            function seekPrevious(pos, newBlock) {
                var tests, position = pos;
                if (position <= 0) return 0;
                for (;--position > 0 && (!0 === newBlock && !0 !== getTest(position).match.newBlockMarker || !0 !== newBlock && !isMask(position) && ((tests = getTests(position)).length < 2 || 2 === tests.length && "" === tests[1].match.def)); ) ;
                return position;
            }
            function writeBuffer(input, buffer, caretPos, event, triggerInputEvent) {
                if (event && $.isFunction(opts.onBeforeWrite)) {
                    var result = opts.onBeforeWrite.call(inputmask, event, buffer, caretPos, opts);
                    if (result) {
                        if (result.refreshFromBuffer) {
                            var refresh = result.refreshFromBuffer;
                            refreshFromBuffer(!0 === refresh ? refresh : refresh.start, refresh.end, result.buffer || buffer),
                                buffer = getBuffer(!0);
                        }
                        caretPos !== undefined && (caretPos = result.caret !== undefined ? result.caret : caretPos);
                    }
                }
                input !== undefined && (input.inputmask._valueSet(buffer.join("")), caretPos === undefined || event !== undefined && "blur" === event.type ? renderColorMask(input, caretPos, 0 === buffer.length) : caret(input, caretPos),
                !0 === triggerInputEvent && (skipInputEvent = !0, $(input).trigger("input")));
            }
            function getPlaceholder(pos, test, returnPL) {
                if ((test = test || getTest(pos).match).placeholder !== undefined || !0 === returnPL) return $.isFunction(test.placeholder) ? test.placeholder(opts) : test.placeholder;
                if (null === test.fn) {
                    if (pos > -1 && getMaskSet().validPositions[pos] === undefined) {
                        var prevTest, tests = getTests(pos), staticAlternations = [];
                        if (tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0)) for (var i = 0; i < tests.length; i++) if (!0 !== tests[i].match.optionality && !0 !== tests[i].match.optionalQuantifier && (null === tests[i].match.fn || prevTest === undefined || !1 !== tests[i].match.fn.test(prevTest.match.def, getMaskSet(), pos, !0, opts)) && (staticAlternations.push(tests[i]),
                            null === tests[i].match.fn && (prevTest = tests[i]), staticAlternations.length > 1 && /[0-9a-bA-Z]/.test(staticAlternations[0].match.def))) return opts.placeholder.charAt(pos % opts.placeholder.length);
                    }
                    return test.def;
                }
                return opts.placeholder.charAt(pos % opts.placeholder.length);
            }
            var valueBuffer, EventRuler = {
                on: function(input, eventName, eventHandler) {
                    var ev = function(e) {
                        var that = this;
                        if (that.inputmask === undefined && "FORM" !== this.nodeName) {
                            var imOpts = $.data(that, "_inputmask_opts");
                            imOpts ? new Inputmask(imOpts).mask(that) : EventRuler.off(that);
                        } else {
                            if ("setvalue" === e.type || "FORM" === this.nodeName || !(that.disabled || that.readOnly && !("keydown" === e.type && e.ctrlKey && 67 === e.keyCode || !1 === opts.tabThrough && e.keyCode === Inputmask.keyCode.TAB))) {
                                switch (e.type) {
                                    case "input":
                                        if (!0 === skipInputEvent) return skipInputEvent = !1, e.preventDefault();
                                        mobile && (trackCaret = !0);
                                        break;

                                    case "keydown":
                                        skipKeyPressEvent = !1, skipInputEvent = !1;
                                        break;

                                    case "keypress":
                                        if (!0 === skipKeyPressEvent) return e.preventDefault();
                                        skipKeyPressEvent = !0;
                                        break;

                                    case "click":
                                        if (iemobile || iphone) {
                                            var args = arguments;
                                            return setTimeout(function() {
                                                eventHandler.apply(that, args);
                                            }, 0), !1;
                                        }
                                }
                                var returnVal = eventHandler.apply(that, arguments);
                                return trackCaret && (trackCaret = !1, setTimeout(function() {
                                    caret(that, that.inputmask.caretPos, undefined, !0);
                                })), !1 === returnVal && (e.preventDefault(), e.stopPropagation()), returnVal;
                            }
                            e.preventDefault();
                        }
                    };
                    input.inputmask.events[eventName] = input.inputmask.events[eventName] || [], input.inputmask.events[eventName].push(ev),
                        -1 !== $.inArray(eventName, [ "submit", "reset" ]) ? null !== input.form && $(input.form).on(eventName, ev) : $(input).on(eventName, ev);
                },
                off: function(input, event) {
                    var events;
                    input.inputmask && input.inputmask.events && (event ? (events = [])[event] = input.inputmask.events[event] : events = input.inputmask.events,
                        $.each(events, function(eventName, evArr) {
                            for (;evArr.length > 0; ) {
                                var ev = evArr.pop();
                                -1 !== $.inArray(eventName, [ "submit", "reset" ]) ? null !== input.form && $(input.form).off(eventName, ev) : $(input).off(eventName, ev);
                            }
                            delete input.inputmask.events[eventName];
                        }));
                }
            }, EventHandlers = {
                keydownEvent: function(e) {
                    var input = this, $input = $(input), k = e.keyCode, pos = caret(input);
                    if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE || iphone && k === Inputmask.keyCode.BACKSPACE_SAFARI || e.ctrlKey && k === Inputmask.keyCode.X && !isInputEventSupported("cut")) e.preventDefault(),
                        handleRemove(input, k, pos), writeBuffer(input, getBuffer(!0), getMaskSet().p, e, input.inputmask._valueGet() !== getBuffer().join("")),
                        input.inputmask._valueGet() === getBufferTemplate().join("") ? $input.trigger("cleared") : !0 === isComplete(getBuffer()) && $input.trigger("complete"); else if (k === Inputmask.keyCode.END || k === Inputmask.keyCode.PAGE_DOWN) {
                        e.preventDefault();
                        var caretPos = seekNext(getLastValidPosition());
                        opts.insertMode || caretPos !== getMaskSet().maskLength || e.shiftKey || caretPos--,
                            caret(input, e.shiftKey ? pos.begin : caretPos, caretPos, !0);
                    } else k === Inputmask.keyCode.HOME && !e.shiftKey || k === Inputmask.keyCode.PAGE_UP ? (e.preventDefault(),
                        caret(input, 0, e.shiftKey ? pos.begin : 0, !0)) : (opts.undoOnEscape && k === Inputmask.keyCode.ESCAPE || 90 === k && e.ctrlKey) && !0 !== e.altKey ? (checkVal(input, !0, !1, undoValue.split("")),
                        $input.trigger("click")) : k !== Inputmask.keyCode.INSERT || e.shiftKey || e.ctrlKey ? !0 === opts.tabThrough && k === Inputmask.keyCode.TAB ? (!0 === e.shiftKey ? (null === getTest(pos.begin).match.fn && (pos.begin = seekNext(pos.begin)),
                        pos.end = seekPrevious(pos.begin, !0), pos.begin = seekPrevious(pos.end, !0)) : (pos.begin = seekNext(pos.begin, !0),
                        pos.end = seekNext(pos.begin, !0), pos.end < getMaskSet().maskLength && pos.end--),
                    pos.begin < getMaskSet().maskLength && (e.preventDefault(), caret(input, pos.begin, pos.end))) : e.shiftKey || !1 === opts.insertMode && (k === Inputmask.keyCode.RIGHT ? setTimeout(function() {
                        var caretPos = caret(input);
                        caret(input, caretPos.begin);
                    }, 0) : k === Inputmask.keyCode.LEFT && setTimeout(function() {
                        var caretPos = caret(input);
                        caret(input, isRTL ? caretPos.begin + 1 : caretPos.begin - 1);
                    }, 0)) : (opts.insertMode = !opts.insertMode, caret(input, opts.insertMode || pos.begin !== getMaskSet().maskLength ? pos.begin : pos.begin - 1));
                    opts.onKeyDown.call(this, e, getBuffer(), caret(input).begin, opts), ignorable = -1 !== $.inArray(k, opts.ignorables);
                },
                keypressEvent: function(e, checkval, writeOut, strict, ndx) {
                    var input = this, $input = $(input), k = e.which || e.charCode || e.keyCode;
                    if (!(!0 === checkval || e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable)) return k === Inputmask.keyCode.ENTER && undoValue !== getBuffer().join("") && (undoValue = getBuffer().join(""),
                        setTimeout(function() {
                            $input.trigger("change");
                        }, 0)), !0;
                    if (k) {
                        46 === k && !1 === e.shiftKey && "" !== opts.radixPoint && (k = opts.radixPoint.charCodeAt(0));
                        var forwardPosition, pos = checkval ? {
                            begin: ndx,
                            end: ndx
                        } : caret(input), c = String.fromCharCode(k), offset = 0;
                        if (opts._radixDance && opts.numericInput) {
                            var caretPos = getBuffer().indexOf(opts.radixPoint.charAt(0)) + 1;
                            pos.begin <= caretPos && (k === opts.radixPoint.charCodeAt(0) && (offset = 1), pos.begin -= 1,
                                pos.end -= 1);
                        }
                        getMaskSet().writeOutBuffer = !0;
                        var valResult = isValid(pos, c, strict);
                        if (!1 !== valResult && (resetMaskSet(!0), forwardPosition = valResult.caret !== undefined ? valResult.caret : seekNext(valResult.pos.begin ? valResult.pos.begin : valResult.pos),
                                getMaskSet().p = forwardPosition), forwardPosition = (opts.numericInput && valResult.caret === undefined ? seekPrevious(forwardPosition) : forwardPosition) + offset,
                            !1 !== writeOut && (setTimeout(function() {
                                opts.onKeyValidation.call(input, k, valResult, opts);
                            }, 0), getMaskSet().writeOutBuffer && !1 !== valResult)) {
                            var buffer = getBuffer();
                            writeBuffer(input, buffer, forwardPosition, e, !0 !== checkval), !0 !== checkval && setTimeout(function() {
                                !0 === isComplete(buffer) && $input.trigger("complete");
                            }, 0);
                        }
                        if (e.preventDefault(), checkval) return !1 !== valResult && (valResult.forwardPosition = forwardPosition),
                            valResult;
                    }
                },
                pasteEvent: function(e) {
                    var tempValue, ev = e.originalEvent || e, $input = $(this), inputValue = this.inputmask._valueGet(!0), caretPos = caret(this);
                    isRTL && (tempValue = caretPos.end, caretPos.end = caretPos.begin, caretPos.begin = tempValue);
                    var valueBeforeCaret = inputValue.substr(0, caretPos.begin), valueAfterCaret = inputValue.substr(caretPos.end, inputValue.length);
                    if (valueBeforeCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(0, caretPos.begin).join("") && (valueBeforeCaret = ""),
                        valueAfterCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(caretPos.end).join("") && (valueAfterCaret = ""),
                        isRTL && (tempValue = valueBeforeCaret, valueBeforeCaret = valueAfterCaret, valueAfterCaret = tempValue),
                        window.clipboardData && window.clipboardData.getData) inputValue = valueBeforeCaret + window.clipboardData.getData("Text") + valueAfterCaret; else {
                        if (!ev.clipboardData || !ev.clipboardData.getData) return !0;
                        inputValue = valueBeforeCaret + ev.clipboardData.getData("text/plain") + valueAfterCaret;
                    }
                    var pasteValue = inputValue;
                    if ($.isFunction(opts.onBeforePaste)) {
                        if (!1 === (pasteValue = opts.onBeforePaste.call(inputmask, inputValue, opts))) return e.preventDefault();
                        pasteValue || (pasteValue = inputValue);
                    }
                    return checkVal(this, !1, !1, isRTL ? pasteValue.split("").reverse() : pasteValue.toString().split("")),
                        writeBuffer(this, getBuffer(), seekNext(getLastValidPosition()), e, undoValue !== getBuffer().join("")),
                    !0 === isComplete(getBuffer()) && $input.trigger("complete"), e.preventDefault();
                },
                inputFallBackEvent: function(e) {
                    var input = this, inputValue = input.inputmask._valueGet();
                    if (getBuffer().join("") !== inputValue) {
                        var caretPos = caret(input);
                        if (inputValue = function(input, inputValue, caretPos) {
                                if (iemobile) {
                                    var inputChar = inputValue.replace(getBuffer().join(""), "");
                                    if (1 === inputChar.length) {
                                        var iv = inputValue.split("");
                                        iv.splice(caretPos.begin, 0, inputChar), inputValue = iv.join("");
                                    }
                                }
                                return inputValue;
                            }(0, inputValue = function(input, inputValue, caretPos) {
                                return "." === inputValue.charAt(caretPos.begin - 1) && "" !== opts.radixPoint && ((inputValue = inputValue.split(""))[caretPos.begin - 1] = opts.radixPoint.charAt(0),
                                    inputValue = inputValue.join("")), inputValue;
                            }(0, inputValue, caretPos), caretPos), getBuffer().join("") !== inputValue) {
                            var buffer = getBuffer().join(""), offset = !opts.numericInput && inputValue.length > buffer.length ? -1 : 0, frontPart = inputValue.substr(0, caretPos.begin), backPart = inputValue.substr(caretPos.begin), frontBufferPart = buffer.substr(0, caretPos.begin + offset), backBufferPart = buffer.substr(caretPos.begin + offset), selection = caretPos, entries = "", isEntry = !1;
                            if (frontPart !== frontBufferPart) {
                                for (var fpl = (isEntry = frontPart.length >= frontBufferPart.length) ? frontPart.length : frontBufferPart.length, i = 0; frontPart.charAt(i) === frontBufferPart.charAt(i) && i < fpl; i++) ;
                                isEntry && (0 === offset && (selection.begin = i), entries += frontPart.slice(i, selection.end));
                            }
                            if (backPart !== backBufferPart && (backPart.length > backBufferPart.length ? entries += backPart.slice(0, 1) : backPart.length < backBufferPart.length && (selection.end += backBufferPart.length - backPart.length,
                                isEntry || "" === opts.radixPoint || "" !== backPart || frontPart.charAt(selection.begin + offset - 1) !== opts.radixPoint || (selection.begin--,
                                    entries = opts.radixPoint))), writeBuffer(input, getBuffer(), {
                                    begin: selection.begin + offset,
                                    end: selection.end + offset
                                }), entries.length > 0) $.each(entries.split(""), function(ndx, entry) {
                                var keypress = new $.Event("keypress");
                                keypress.which = entry.charCodeAt(0), ignorable = !1, EventHandlers.keypressEvent.call(input, keypress);
                            }); else {
                                selection.begin === selection.end - 1 && (selection.begin = seekPrevious(selection.begin + 1),
                                    selection.begin === selection.end - 1 ? caret(input, selection.begin) : caret(input, selection.begin, selection.end));
                                var keydown = new $.Event("keydown");
                                keydown.keyCode = opts.numericInput ? Inputmask.keyCode.BACKSPACE : Inputmask.keyCode.DELETE,
                                    EventHandlers.keydownEvent.call(input, keydown), !1 === opts.insertMode && caret(input, caret(input).begin - 1);
                            }
                            e.preventDefault();
                        }
                    }
                },
                setValueEvent: function(e) {
                    this.inputmask.refreshValue = !1;
                    var value = this.inputmask._valueGet(!0);
                    $.isFunction(opts.onBeforeMask) && (value = opts.onBeforeMask.call(inputmask, value, opts) || value),
                        value = value.split(""), checkVal(this, !0, !1, isRTL ? value.reverse() : value),
                        undoValue = getBuffer().join(""), (opts.clearMaskOnLostFocus || opts.clearIncomplete) && this.inputmask._valueGet() === getBufferTemplate().join("") && this.inputmask._valueSet("");
                },
                focusEvent: function(e) {
                    var nptValue = this.inputmask._valueGet();
                    opts.showMaskOnFocus && (!opts.showMaskOnHover || opts.showMaskOnHover && "" === nptValue) && (this.inputmask._valueGet() !== getBuffer().join("") ? writeBuffer(this, getBuffer(), seekNext(getLastValidPosition())) : !1 === mouseEnter && caret(this, seekNext(getLastValidPosition()))),
                    !0 === opts.positionCaretOnTab && !1 === mouseEnter && EventHandlers.clickEvent.apply(this, [ e, !0 ]),
                        undoValue = getBuffer().join("");
                },
                mouseleaveEvent: function(e) {
                    if (mouseEnter = !1, opts.clearMaskOnLostFocus && document.activeElement !== this) {
                        var buffer = getBuffer().slice(), nptValue = this.inputmask._valueGet();
                        nptValue !== this.getAttribute("placeholder") && "" !== nptValue && (-1 === getLastValidPosition() && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer),
                            writeBuffer(this, buffer));
                    }
                },
                clickEvent: function(e, tabbed) {
                    var input = this;
                    setTimeout(function() {
                        if (document.activeElement === input) {
                            var selectedCaret = caret(input);
                            if (tabbed && (isRTL ? selectedCaret.end = selectedCaret.begin : selectedCaret.begin = selectedCaret.end),
                                selectedCaret.begin === selectedCaret.end) switch (opts.positionCaretOnClick) {
                                case "none":
                                    break;

                                case "select":
                                    caret(input, 0, getBuffer().length);
                                    break;

                                case "radixFocus":
                                    if (function(clickPos) {
                                            if ("" !== opts.radixPoint) {
                                                var vps = getMaskSet().validPositions;
                                                if (vps[clickPos] === undefined || vps[clickPos].input === getPlaceholder(clickPos)) {
                                                    if (clickPos < seekNext(-1)) return !0;
                                                    var radixPos = $.inArray(opts.radixPoint, getBuffer());
                                                    if (-1 !== radixPos) {
                                                        for (var vp in vps) if (radixPos < vp && vps[vp].input !== getPlaceholder(vp)) return !1;
                                                        return !0;
                                                    }
                                                }
                                            }
                                            return !1;
                                        }(selectedCaret.begin)) {
                                        var radixPos = getBuffer().join("").indexOf(opts.radixPoint);
                                        caret(input, opts.numericInput ? seekNext(radixPos) : radixPos);
                                        break;
                                    }

                                default:
                                    var clickPosition = selectedCaret.begin, lvclickPosition = getLastValidPosition(clickPosition, !0), lastPosition = seekNext(lvclickPosition);
                                    if (clickPosition < lastPosition) caret(input, isMask(clickPosition, !0) || isMask(clickPosition - 1, !0) ? clickPosition : seekNext(clickPosition)); else {
                                        var lvp = getMaskSet().validPositions[lvclickPosition], tt = getTestTemplate(lastPosition, lvp ? lvp.match.locator : undefined, lvp), placeholder = getPlaceholder(lastPosition, tt.match);
                                        if ("" !== placeholder && getBuffer()[lastPosition] !== placeholder && !0 !== tt.match.optionalQuantifier && !0 !== tt.match.newBlockMarker || !isMask(lastPosition, !0) && tt.match.def === placeholder) {
                                            var newPos = seekNext(lastPosition);
                                            (clickPosition >= newPos || clickPosition === lastPosition) && (lastPosition = newPos);
                                        }
                                        caret(input, lastPosition);
                                    }
                            }
                        }
                    }, 0);
                },
                dblclickEvent: function(e) {
                    var input = this;
                    setTimeout(function() {
                        caret(input, 0, seekNext(getLastValidPosition()));
                    }, 0);
                },
                cutEvent: function(e) {
                    var $input = $(this), pos = caret(this), ev = e.originalEvent || e, clipboardData = window.clipboardData || ev.clipboardData, clipData = isRTL ? getBuffer().slice(pos.end, pos.begin) : getBuffer().slice(pos.begin, pos.end);
                    clipboardData.setData("text", isRTL ? clipData.reverse().join("") : clipData.join("")),
                    document.execCommand && document.execCommand("copy"), handleRemove(this, Inputmask.keyCode.DELETE, pos),
                        writeBuffer(this, getBuffer(), getMaskSet().p, e, undoValue !== getBuffer().join("")),
                    this.inputmask._valueGet() === getBufferTemplate().join("") && $input.trigger("cleared");
                },
                blurEvent: function(e) {
                    var $input = $(this);
                    if (this.inputmask) {
                        var nptValue = this.inputmask._valueGet(), buffer = getBuffer().slice();
                        "" === nptValue && colorMask === undefined || (opts.clearMaskOnLostFocus && (-1 === getLastValidPosition() && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer)),
                        !1 === isComplete(buffer) && (setTimeout(function() {
                            $input.trigger("incomplete");
                        }, 0), opts.clearIncomplete && (resetMaskSet(), buffer = opts.clearMaskOnLostFocus ? [] : getBufferTemplate().slice())),
                            writeBuffer(this, buffer, undefined, e)), undoValue !== getBuffer().join("") && (undoValue = buffer.join(""),
                            $input.trigger("change"));
                    }
                },
                mouseenterEvent: function(e) {
                    mouseEnter = !0, document.activeElement !== this && opts.showMaskOnHover && this.inputmask._valueGet() !== getBuffer().join("") && writeBuffer(this, getBuffer());
                },
                submitEvent: function(e) {
                    undoValue !== getBuffer().join("") && $el.trigger("change"), opts.clearMaskOnLostFocus && -1 === getLastValidPosition() && el.inputmask._valueGet && el.inputmask._valueGet() === getBufferTemplate().join("") && el.inputmask._valueSet(""),
                    opts.removeMaskOnSubmit && (el.inputmask._valueSet(el.inputmask.unmaskedvalue(), !0),
                        setTimeout(function() {
                            writeBuffer(el, getBuffer());
                        }, 0));
                },
                resetEvent: function(e) {
                    el.inputmask.refreshValue = !0, setTimeout(function() {
                        $el.trigger("setvalue");
                    }, 0);
                }
            };
            function checkVal(input, writeOut, strict, nptvl, initiatingEvent) {
                var inputValue = nptvl.slice(), charCodes = "", initialNdx = -1, result = undefined;
                if (resetMaskSet(), strict || !0 === opts.autoUnmask) initialNdx = seekNext(initialNdx); else {
                    var staticInput = getBufferTemplate().slice(0, seekNext(-1)).join(""), matches = inputValue.join("").match(new RegExp("^" + Inputmask.escapeRegex(staticInput), "g"));
                    matches && matches.length > 0 && (inputValue.splice(0, matches.length * staticInput.length),
                        initialNdx = seekNext(initialNdx));
                }
                -1 === initialNdx ? (getMaskSet().p = seekNext(initialNdx), initialNdx = 0) : getMaskSet().p = initialNdx,
                    $.each(inputValue, function(ndx, charCode) {
                        if (charCode !== undefined) if (getMaskSet().validPositions[ndx] === undefined && inputValue[ndx] === getPlaceholder(ndx) && isMask(ndx, !0) && !1 === isValid(ndx, inputValue[ndx], !0, undefined, undefined, !0)) getMaskSet().p++; else {
                            var keypress = new $.Event("_checkval");
                            keypress.which = charCode.charCodeAt(0), charCodes += charCode;
                            var lvp = getLastValidPosition(undefined, !0), prevTest = getTest(lvp), nextTest = getTestTemplate(lvp + 1, prevTest ? prevTest.locator.slice() : undefined, lvp);
                            if (!function(ndx, charCodes) {
                                    return -1 !== getMaskTemplate(!0, 0, !1).slice(ndx, seekNext(ndx)).join("").indexOf(charCodes) && !isMask(ndx) && (getTest(ndx).match.nativeDef === charCodes.charAt(0) || " " === getTest(ndx).match.nativeDef && getTest(ndx + 1).match.nativeDef === charCodes.charAt(0));
                                }(initialNdx, charCodes) || strict || opts.autoUnmask) {
                                var pos = strict ? ndx : null == nextTest.match.fn && nextTest.match.optionality && lvp + 1 < getMaskSet().p ? lvp + 1 : getMaskSet().p;
                                (result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, pos)) && (initialNdx = pos + 1,
                                    charCodes = "");
                            } else result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, !0, lvp + 1);
                            writeBuffer(undefined, getBuffer(), result.forwardPosition, keypress, !1);
                        }
                    }), writeOut && writeBuffer(input, getBuffer(), result ? result.forwardPosition : undefined, initiatingEvent || new $.Event("checkval"), initiatingEvent && "input" === initiatingEvent.type);
            }
            function unmaskedvalue(input) {
                if (input) {
                    if (input.inputmask === undefined) return input.value;
                    input.inputmask && input.inputmask.refreshValue && EventHandlers.setValueEvent.call(input);
                }
                var umValue = [], vps = getMaskSet().validPositions;
                for (var pndx in vps) vps[pndx].match && null != vps[pndx].match.fn && umValue.push(vps[pndx].input);
                var unmaskedValue = 0 === umValue.length ? "" : (isRTL ? umValue.reverse() : umValue).join("");
                if ($.isFunction(opts.onUnMask)) {
                    var bufferValue = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("");
                    unmaskedValue = opts.onUnMask.call(inputmask, bufferValue, unmaskedValue, opts);
                }
                return unmaskedValue;
            }
            function caret(input, begin, end, notranslate) {
                function translatePosition(pos) {
                    return !0 === notranslate || !isRTL || "number" != typeof pos || opts.greedy && "" === opts.placeholder || (pos = input.inputmask._valueGet().length - pos),
                        pos;
                }
                var range;
                if (begin === undefined) return input.setSelectionRange ? (begin = input.selectionStart,
                    end = input.selectionEnd) : window.getSelection ? (range = window.getSelection().getRangeAt(0)).commonAncestorContainer.parentNode !== input && range.commonAncestorContainer !== input || (begin = range.startOffset,
                    end = range.endOffset) : document.selection && document.selection.createRange && (end = (begin = 0 - (range = document.selection.createRange()).duplicate().moveStart("character", -input.inputmask._valueGet().length)) + range.text.length),
                    {
                        begin: translatePosition(begin),
                        end: translatePosition(end)
                    };
                if ($.isArray(begin) && (end = isRTL ? begin[0] : begin[1], begin = isRTL ? begin[1] : begin[0]),
                    begin.begin !== undefined && (end = isRTL ? begin.begin : begin.end, begin = isRTL ? begin.end : begin.begin),
                    "number" == typeof begin) {
                    begin = translatePosition(begin), end = "number" == typeof (end = translatePosition(end)) ? end : begin;
                    var scrollCalc = parseInt(((input.ownerDocument.defaultView || window).getComputedStyle ? (input.ownerDocument.defaultView || window).getComputedStyle(input, null) : input.currentStyle).fontSize) * end;
                    if (input.scrollLeft = scrollCalc > input.scrollWidth ? scrollCalc : 0, iphone || !1 !== opts.insertMode || begin !== end || end++,
                            input.inputmask.caretPos = {
                                begin: begin,
                                end: end
                            }, input.setSelectionRange) input.selectionStart = begin, input.selectionEnd = end; else if (window.getSelection) {
                        if (range = document.createRange(), input.firstChild === undefined || null === input.firstChild) {
                            var textNode = document.createTextNode("");
                            input.appendChild(textNode);
                        }
                        range.setStart(input.firstChild, begin < input.inputmask._valueGet().length ? begin : input.inputmask._valueGet().length),
                            range.setEnd(input.firstChild, end < input.inputmask._valueGet().length ? end : input.inputmask._valueGet().length),
                            range.collapse(!0);
                        var sel = window.getSelection();
                        sel.removeAllRanges(), sel.addRange(range);
                    } else input.createTextRange && ((range = input.createTextRange()).collapse(!0),
                        range.moveEnd("character", end), range.moveStart("character", begin), range.select());
                    renderColorMask(input, {
                        begin: begin,
                        end: end
                    });
                }
            }
            function determineLastRequiredPosition(returnDefinition) {
                var pos, testPos, buffer = getBuffer(), bl = buffer.length, lvp = getLastValidPosition(), positions = {}, lvTest = getMaskSet().validPositions[lvp], ndxIntlzr = lvTest !== undefined ? lvTest.locator.slice() : undefined;
                for (pos = lvp + 1; pos < buffer.length; pos++) ndxIntlzr = (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1)).locator.slice(),
                    positions[pos] = $.extend(!0, {}, testPos);
                var lvTestAlt = lvTest && lvTest.alternation !== undefined ? lvTest.locator[lvTest.alternation] : undefined;
                for (pos = bl - 1; pos > lvp && (((testPos = positions[pos]).match.optionality || testPos.match.optionalQuantifier && testPos.match.newBlockMarker || lvTestAlt && (lvTestAlt !== positions[pos].locator[lvTest.alternation] && null != testPos.match.fn || null === testPos.match.fn && testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAlt.toString().split(",")) && "" !== getTests(pos)[0].def)) && buffer[pos] === getPlaceholder(pos, testPos.match)); pos--) bl--;
                return returnDefinition ? {
                    l: bl,
                    def: positions[bl] ? positions[bl].match : undefined
                } : bl;
            }
            function clearOptionalTail(buffer) {
                for (var validPos, rl = determineLastRequiredPosition(), bl = buffer.length, lv = getMaskSet().validPositions[getLastValidPosition()]; rl < bl && !isMask(rl, !0) && (validPos = lv !== undefined ? getTestTemplate(rl, lv.locator.slice(""), lv) : getTest(rl)) && !0 !== validPos.match.optionality && (!0 !== validPos.match.optionalQuantifier && !0 !== validPos.match.newBlockMarker || rl + 1 === bl && "" === (lv !== undefined ? getTestTemplate(rl + 1, lv.locator.slice(""), lv) : getTest(rl + 1)).match.def); ) rl++;
                for (;(validPos = getMaskSet().validPositions[rl - 1]) && validPos && validPos.match.optionality && validPos.input === opts.skipOptionalPartCharacter; ) rl--;
                return buffer.splice(rl), buffer;
            }
            function isComplete(buffer) {
                if ($.isFunction(opts.isComplete)) return opts.isComplete(buffer, opts);
                if ("*" === opts.repeat) return undefined;
                var complete = !1, lrp = determineLastRequiredPosition(!0), aml = seekPrevious(lrp.l);
                if (lrp.def === undefined || lrp.def.newBlockMarker || lrp.def.optionality || lrp.def.optionalQuantifier) {
                    complete = !0;
                    for (var i = 0; i <= aml; i++) {
                        var test = getTestTemplate(i).match;
                        if (null !== test.fn && getMaskSet().validPositions[i] === undefined && !0 !== test.optionality && !0 !== test.optionalQuantifier || null === test.fn && buffer[i] !== getPlaceholder(i, test)) {
                            complete = !1;
                            break;
                        }
                    }
                }
                return complete;
            }
            function handleRemove(input, k, pos, strict, fromIsValid) {
                if ((opts.numericInput || isRTL) && (k === Inputmask.keyCode.BACKSPACE ? k = Inputmask.keyCode.DELETE : k === Inputmask.keyCode.DELETE && (k = Inputmask.keyCode.BACKSPACE),
                        isRTL)) {
                    var pend = pos.end;
                    pos.end = pos.begin, pos.begin = pend;
                }
                if (k === Inputmask.keyCode.BACKSPACE && (pos.end - pos.begin < 1 || !1 === opts.insertMode) ? (pos.begin = seekPrevious(pos.begin),
                    getMaskSet().validPositions[pos.begin] !== undefined && getMaskSet().validPositions[pos.begin].input === opts.groupSeparator && pos.begin--) : k === Inputmask.keyCode.DELETE && pos.begin === pos.end && (pos.end = isMask(pos.end, !0) && getMaskSet().validPositions[pos.end] && getMaskSet().validPositions[pos.end].input !== opts.radixPoint ? pos.end + 1 : seekNext(pos.end) + 1,
                    getMaskSet().validPositions[pos.begin] !== undefined && getMaskSet().validPositions[pos.begin].input === opts.groupSeparator && pos.end++),
                        stripValidPositions(pos.begin, pos.end, !1, strict), !0 !== strict && null !== opts.keepStatic && !1 !== opts.keepStatic) {
                    var result = alternate(!0);
                    result && (pos.begin = result.caret !== undefined ? result.caret : result.pos ? seekNext(result.pos.begin ? result.pos.begin : result.pos) : getLastValidPosition(-1, !0));
                }
                var lvp = getLastValidPosition(pos.begin, !0);
                if (lvp < pos.begin || -1 === pos.begin) getMaskSet().p = seekNext(lvp); else if (!0 !== strict && (getMaskSet().p = pos.begin,
                    !0 !== fromIsValid)) for (;getMaskSet().p < lvp && getMaskSet().validPositions[getMaskSet().p] === undefined; ) getMaskSet().p++;
            }
            function initializeColorMask(input) {
                var computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null);
                var template = document.createElement("div");
                template.style.width = computedStyle.width, template.style.textAlign = computedStyle.textAlign,
                    colorMask = document.createElement("div"), input.inputmask.colorMask = colorMask,
                    colorMask.className = "im-colormask", input.parentNode.insertBefore(colorMask, input),
                    input.parentNode.removeChild(input), colorMask.appendChild(template), colorMask.appendChild(input),
                    input.style.left = template.offsetLeft + "px", $(input).on("click", function(e) {
                    return caret(input, function(clientx) {
                        var caretPos, e = document.createElement("span");
                        for (var style in computedStyle) isNaN(style) && -1 !== style.indexOf("font") && (e.style[style] = computedStyle[style]);
                        e.style.textTransform = computedStyle.textTransform, e.style.letterSpacing = computedStyle.letterSpacing,
                            e.style.position = "absolute", e.style.height = "auto", e.style.width = "auto",
                            e.style.visibility = "hidden", e.style.whiteSpace = "nowrap", document.body.appendChild(e);
                        var itl, inputText = input.inputmask._valueGet(), previousWidth = 0;
                        for (caretPos = 0, itl = inputText.length; caretPos <= itl; caretPos++) {
                            if (e.innerHTML += inputText.charAt(caretPos) || "_", e.offsetWidth >= clientx) {
                                var offset1 = clientx - previousWidth, offset2 = e.offsetWidth - clientx;
                                e.innerHTML = inputText.charAt(caretPos), caretPos = (offset1 -= e.offsetWidth / 3) < offset2 ? caretPos - 1 : caretPos;
                                break;
                            }
                            previousWidth = e.offsetWidth;
                        }
                        return document.body.removeChild(e), caretPos;
                    }(e.clientX)), EventHandlers.clickEvent.call(input, [ e ]);
                }), $(input).on("keydown", function(e) {
                    e.shiftKey || !1 === opts.insertMode || setTimeout(function() {
                        renderColorMask(input);
                    }, 0);
                });
            }
            function renderColorMask(input, caretPos, clear) {
                var test, testPos, ndxIntlzr, maskTemplate = [], isStatic = !1, pos = 0;
                function setEntry(entry) {
                    if (entry === undefined && (entry = ""), isStatic || null !== test.fn && testPos.input !== undefined) if (isStatic && (null !== test.fn && testPos.input !== undefined || "" === test.def)) {
                        isStatic = !1;
                        var mtl = maskTemplate.length;
                        maskTemplate[mtl - 1] = maskTemplate[mtl - 1] + "</span>", maskTemplate.push(entry);
                    } else maskTemplate.push(entry); else isStatic = !0, maskTemplate.push("<span class='im-static'>" + entry);
                }
                if (colorMask !== undefined) {
                    var buffer = getBuffer();
                    if (caretPos === undefined ? caretPos = caret(input) : caretPos.begin === undefined && (caretPos = {
                            begin: caretPos,
                            end: caretPos
                        }), !0 !== clear) {
                        var lvp = getLastValidPosition();
                        do {
                            getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos],
                                test = testPos.match, ndxIntlzr = testPos.locator.slice(), setEntry(buffer[pos])) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1),
                                test = testPos.match, ndxIntlzr = testPos.locator.slice(), (!1 === opts.jitMasking || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && setEntry(getPlaceholder(pos, test))),
                                pos++;
                        } while ((maxLength === undefined || pos < maxLength) && (null !== test.fn || "" !== test.def) || lvp > pos || isStatic);
                        isStatic && setEntry(), document.activeElement === input && (maskTemplate.splice(caretPos.begin, 0, caretPos.begin === caretPos.end ? '<mark class="im-caret" style="border-right-width: 1px;border-right-style: solid;">' : '<mark class="im-caret-select">'),
                            maskTemplate.splice(caretPos.end + 1, 0, "</mark>"));
                    }
                    var template = colorMask.getElementsByTagName("div")[0];
                    template.innerHTML = maskTemplate.join(""), input.inputmask.positionColorMask(input, template);
                }
            }
            if (Inputmask.prototype.positionColorMask = function(input, template) {
                    input.style.left = template.offsetLeft + "px";
                }, actionObj !== undefined) switch (actionObj.action) {
                case "isComplete":
                    return el = actionObj.el, isComplete(getBuffer());

                case "unmaskedvalue":
                    return el !== undefined && actionObj.value === undefined || (valueBuffer = actionObj.value,
                        valueBuffer = ($.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, valueBuffer, opts) || valueBuffer).split(""),
                        checkVal(undefined, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite.call(inputmask, undefined, getBuffer(), 0, opts)),
                        unmaskedvalue(el);

                case "mask":
                    !function(elem) {
                        EventRuler.off(elem);
                        var isSupported = function(input, opts) {
                            var elementType = input.getAttribute("type"), isSupported = "INPUT" === input.tagName && -1 !== $.inArray(elementType, opts.supportsInputType) || input.isContentEditable || "TEXTAREA" === input.tagName;
                            if (!isSupported) if ("INPUT" === input.tagName) {
                                var el = document.createElement("input");
                                el.setAttribute("type", elementType), isSupported = "text" === el.type, el = null;
                            } else isSupported = "partial";
                            return !1 !== isSupported ? function(npt) {
                                var valueGet, valueSet;
                                function getter() {
                                    return this.inputmask ? this.inputmask.opts.autoUnmask ? this.inputmask.unmaskedvalue() : -1 !== getLastValidPosition() || !0 !== opts.nullable ? document.activeElement === this && opts.clearMaskOnLostFocus ? (isRTL ? clearOptionalTail(getBuffer().slice()).reverse() : clearOptionalTail(getBuffer().slice())).join("") : valueGet.call(this) : "" : valueGet.call(this);
                                }
                                function setter(value) {
                                    valueSet.call(this, value), this.inputmask && $(this).trigger("setvalue");
                                }
                                if (!npt.inputmask.__valueGet) {
                                    if (!0 !== opts.noValuePatching) {
                                        if (Object.getOwnPropertyDescriptor) {
                                            "function" != typeof Object.getPrototypeOf && (Object.getPrototypeOf = "object" === _typeof("test".__proto__) ? function(object) {
                                                return object.__proto__;
                                            } : function(object) {
                                                return object.constructor.prototype;
                                            });
                                            var valueProperty = Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(npt), "value") : undefined;
                                            valueProperty && valueProperty.get && valueProperty.set ? (valueGet = valueProperty.get,
                                                valueSet = valueProperty.set, Object.defineProperty(npt, "value", {
                                                get: getter,
                                                set: setter,
                                                configurable: !0
                                            })) : "INPUT" !== npt.tagName && (valueGet = function() {
                                                return this.textContent;
                                            }, valueSet = function(value) {
                                                this.textContent = value;
                                            }, Object.defineProperty(npt, "value", {
                                                get: getter,
                                                set: setter,
                                                configurable: !0
                                            }));
                                        } else document.__lookupGetter__ && npt.__lookupGetter__("value") && (valueGet = npt.__lookupGetter__("value"),
                                            valueSet = npt.__lookupSetter__("value"), npt.__defineGetter__("value", getter),
                                            npt.__defineSetter__("value", setter));
                                        npt.inputmask.__valueGet = valueGet, npt.inputmask.__valueSet = valueSet;
                                    }
                                    npt.inputmask._valueGet = function(overruleRTL) {
                                        return isRTL && !0 !== overruleRTL ? valueGet.call(this.el).split("").reverse().join("") : valueGet.call(this.el);
                                    }, npt.inputmask._valueSet = function(value, overruleRTL) {
                                        valueSet.call(this.el, null === value || value === undefined ? "" : !0 !== overruleRTL && isRTL ? value.split("").reverse().join("") : value);
                                    }, valueGet === undefined && (valueGet = function() {
                                        return this.value;
                                    }, valueSet = function(value) {
                                        this.value = value;
                                    }, function(type) {
                                        if ($.valHooks && ($.valHooks[type] === undefined || !0 !== $.valHooks[type].inputmaskpatch)) {
                                            var valhookGet = $.valHooks[type] && $.valHooks[type].get ? $.valHooks[type].get : function(elem) {
                                                return elem.value;
                                            }, valhookSet = $.valHooks[type] && $.valHooks[type].set ? $.valHooks[type].set : function(elem, value) {
                                                return elem.value = value, elem;
                                            };
                                            $.valHooks[type] = {
                                                get: function(elem) {
                                                    if (elem.inputmask) {
                                                        if (elem.inputmask.opts.autoUnmask) return elem.inputmask.unmaskedvalue();
                                                        var result = valhookGet(elem);
                                                        return -1 !== getLastValidPosition(undefined, undefined, elem.inputmask.maskset.validPositions) || !0 !== opts.nullable ? result : "";
                                                    }
                                                    return valhookGet(elem);
                                                },
                                                set: function(elem, value) {
                                                    var result, $elem = $(elem);
                                                    return result = valhookSet(elem, value), elem.inputmask && $elem.trigger("setvalue"),
                                                        result;
                                                },
                                                inputmaskpatch: !0
                                            };
                                        }
                                    }(npt.type), function(npt) {
                                        EventRuler.on(npt, "mouseenter", function(event) {
                                            var $input = $(this);
                                            this.inputmask._valueGet() !== getBuffer().join("") && $input.trigger("setvalue");
                                        });
                                    }(npt));
                                }
                            }(input) : input.inputmask = undefined, isSupported;
                        }(elem, opts);
                        if (!1 !== isSupported && ($el = $(el = elem), -1 === (maxLength = el !== undefined ? el.maxLength : undefined) && (maxLength = undefined),
                            !0 === opts.colorMask && initializeColorMask(el), mobile && ("inputmode" in el && (el.inputmode = opts.inputmode,
                                el.setAttribute("inputmode", opts.inputmode)), !0 === opts.disablePredictiveText && ("autocorrect" in el ? el.autocorrect = !1 : (!0 !== opts.colorMask && initializeColorMask(el),
                                el.type = "password"))), !0 === isSupported && (EventRuler.on(el, "submit", EventHandlers.submitEvent),
                                EventRuler.on(el, "reset", EventHandlers.resetEvent), EventRuler.on(el, "mouseenter", EventHandlers.mouseenterEvent),
                                EventRuler.on(el, "blur", EventHandlers.blurEvent), EventRuler.on(el, "focus", EventHandlers.focusEvent),
                                EventRuler.on(el, "mouseleave", EventHandlers.mouseleaveEvent), !0 !== opts.colorMask && EventRuler.on(el, "click", EventHandlers.clickEvent),
                                EventRuler.on(el, "dblclick", EventHandlers.dblclickEvent), EventRuler.on(el, "paste", EventHandlers.pasteEvent),
                                EventRuler.on(el, "dragdrop", EventHandlers.pasteEvent), EventRuler.on(el, "drop", EventHandlers.pasteEvent),
                                EventRuler.on(el, "cut", EventHandlers.cutEvent), EventRuler.on(el, "complete", opts.oncomplete),
                                EventRuler.on(el, "incomplete", opts.onincomplete), EventRuler.on(el, "cleared", opts.oncleared),
                                mobile || !0 === opts.inputEventOnly ? el.removeAttribute("maxLength") : (EventRuler.on(el, "keydown", EventHandlers.keydownEvent),
                                    EventRuler.on(el, "keypress", EventHandlers.keypressEvent)), EventRuler.on(el, "compositionstart", $.noop),
                                EventRuler.on(el, "compositionupdate", $.noop), EventRuler.on(el, "compositionend", $.noop),
                                EventRuler.on(el, "keyup", $.noop), EventRuler.on(el, "input", EventHandlers.inputFallBackEvent),
                                EventRuler.on(el, "beforeinput", $.noop)), EventRuler.on(el, "setvalue", EventHandlers.setValueEvent),
                                undoValue = getBufferTemplate().join(""), "" !== el.inputmask._valueGet(!0) || !1 === opts.clearMaskOnLostFocus || document.activeElement === el)) {
                            var initialValue = $.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, el.inputmask._valueGet(!0), opts) || el.inputmask._valueGet(!0);
                            "" !== initialValue && checkVal(el, !0, !1, isRTL ? initialValue.split("").reverse() : initialValue.split(""));
                            var buffer = getBuffer().slice();
                            undoValue = buffer.join(""), !1 === isComplete(buffer) && opts.clearIncomplete && resetMaskSet(),
                            opts.clearMaskOnLostFocus && document.activeElement !== el && (-1 === getLastValidPosition() ? buffer = [] : clearOptionalTail(buffer)),
                                writeBuffer(el, buffer), document.activeElement === el && caret(el, seekNext(getLastValidPosition()));
                        }
                    }(el);
                    break;

                case "format":
                    return valueBuffer = ($.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, actionObj.value, opts) || actionObj.value).split(""),
                        checkVal(undefined, !0, !1, isRTL ? valueBuffer.reverse() : valueBuffer), actionObj.metadata ? {
                        value: isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""),
                        metadata: maskScope.call(this, {
                            action: "getmetadata"
                        }, maskset, opts)
                    } : isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");

                case "isValid":
                    actionObj.value ? (valueBuffer = actionObj.value.split(""), checkVal(undefined, !0, !0, isRTL ? valueBuffer.reverse() : valueBuffer)) : actionObj.value = getBuffer().join("");
                    for (var buffer = getBuffer(), rl = determineLastRequiredPosition(), lmib = buffer.length - 1; lmib > rl && !isMask(lmib); lmib--) ;
                    return buffer.splice(rl, lmib + 1 - rl), isComplete(buffer) && actionObj.value === getBuffer().join("");

                case "getemptymask":
                    return getBufferTemplate().join("");

                case "remove":
                    if (el && el.inputmask) $.data(el, "_inputmask_opts", null), $el = $(el), el.inputmask._valueSet(opts.autoUnmask ? unmaskedvalue(el) : el.inputmask._valueGet(!0)),
                        EventRuler.off(el), el.inputmask.colorMask && ((colorMask = el.inputmask.colorMask).removeChild(el),
                        colorMask.parentNode.insertBefore(el, colorMask), colorMask.parentNode.removeChild(colorMask)),
                        Object.getOwnPropertyDescriptor && Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value") && el.inputmask.__valueGet && Object.defineProperty(el, "value", {
                            get: el.inputmask.__valueGet,
                            set: el.inputmask.__valueSet,
                            configurable: !0
                        }) : document.__lookupGetter__ && el.__lookupGetter__("value") && el.inputmask.__valueGet && (el.__defineGetter__("value", el.inputmask.__valueGet),
                            el.__defineSetter__("value", el.inputmask.__valueSet)), el.inputmask = undefined;
                    return el;

                case "getmetadata":
                    if ($.isArray(maskset.metadata)) {
                        var maskTarget = getMaskTemplate(!0, 0, !1).join("");
                        return $.each(maskset.metadata, function(ndx, mtdt) {
                            if (mtdt.mask === maskTarget) return maskTarget = mtdt, !1;
                        }), maskTarget;
                    }
                    return maskset.metadata;
            }
        }
        return Inputmask.prototype = {
            dataAttribute: "data-inputmask",
            defaults: {
                placeholder: "_",
                optionalmarker: [ "[", "]" ],
                quantifiermarker: [ "{", "}" ],
                groupmarker: [ "(", ")" ],
                alternatormarker: "|",
                escapeChar: "\\",
                mask: null,
                regex: null,
                oncomplete: $.noop,
                onincomplete: $.noop,
                oncleared: $.noop,
                repeat: 0,
                greedy: !0,
                autoUnmask: !1,
                removeMaskOnSubmit: !1,
                clearMaskOnLostFocus: !0,
                insertMode: !0,
                clearIncomplete: !1,
                alias: null,
                onKeyDown: $.noop,
                onBeforeMask: null,
                onBeforePaste: function(pastedValue, opts) {
                    return $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask.call(this, pastedValue, opts) : pastedValue;
                },
                onBeforeWrite: null,
                onUnMask: null,
                showMaskOnFocus: !0,
                showMaskOnHover: !0,
                onKeyValidation: $.noop,
                skipOptionalPartCharacter: " ",
                numericInput: !1,
                rightAlign: !1,
                undoOnEscape: !0,
                radixPoint: "",
                _radixDance: !1,
                groupSeparator: "",
                keepStatic: null,
                positionCaretOnTab: !0,
                tabThrough: !1,
                supportsInputType: [ "text", "tel", "password", "search" ],
                ignorables: [ 8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 0, 229 ],
                isComplete: null,
                canClearPosition: $.noop,
                preValidation: null,
                postValidation: null,
                staticDefinitionSymbol: undefined,
                jitMasking: !1,
                nullable: !0,
                inputEventOnly: !1,
                noValuePatching: !1,
                positionCaretOnClick: "lvp",
                casing: null,
                inputmode: "verbatim",
                colorMask: !1,
                disablePredictiveText: !1,
                importDataAttributes: !0
            },
            definitions: {
                9: {
                    validator: "[0-9１-９]",
                    definitionSymbol: "*"
                },
                a: {
                    validator: "[A-Za-zА-яЁёÀ-ÿµ]",
                    definitionSymbol: "*"
                },
                "*": {
                    validator: "[0-9１-９A-Za-zА-яЁёÀ-ÿµ]"
                }
            },
            aliases: {},
            masksCache: {},
            mask: function(elems) {
                var that = this;
                return "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),
                    elems = elems.nodeName ? [ elems ] : elems, $.each(elems, function(ndx, el) {
                    var scopedOpts = $.extend(!0, {}, that.opts);
                    if (function(npt, opts, userOptions, dataAttribute) {
                            if (!0 === opts.importDataAttributes) {
                                var option, dataoptions, optionData, p, importOption = function(option, optionData) {
                                    null !== (optionData = optionData !== undefined ? optionData : npt.getAttribute(dataAttribute + "-" + option)) && ("string" == typeof optionData && (0 === option.indexOf("on") ? optionData = window[optionData] : "false" === optionData ? optionData = !1 : "true" === optionData && (optionData = !0)),
                                        userOptions[option] = optionData);
                                }, attrOptions = npt.getAttribute(dataAttribute);
                                if (attrOptions && "" !== attrOptions && (attrOptions = attrOptions.replace(/'/g, '"'),
                                        dataoptions = JSON.parse("{" + attrOptions + "}")), dataoptions) for (p in optionData = undefined,
                                    dataoptions) if ("alias" === p.toLowerCase()) {
                                    optionData = dataoptions[p];
                                    break;
                                }
                                for (option in importOption("alias", optionData), userOptions.alias && resolveAlias(userOptions.alias, userOptions, opts),
                                    opts) {
                                    if (dataoptions) for (p in optionData = undefined, dataoptions) if (p.toLowerCase() === option.toLowerCase()) {
                                        optionData = dataoptions[p];
                                        break;
                                    }
                                    importOption(option, optionData);
                                }
                            }
                            return $.extend(!0, opts, userOptions), ("rtl" === npt.dir || opts.rightAlign) && (npt.style.textAlign = "right"),
                            ("rtl" === npt.dir || opts.numericInput) && (npt.dir = "ltr", npt.removeAttribute("dir"),
                                opts.isRTL = !0), Object.keys(userOptions).length;
                        }(el, scopedOpts, $.extend(!0, {}, that.userOptions), that.dataAttribute)) {
                        var maskset = generateMaskSet(scopedOpts, that.noMasksCache);
                        maskset !== undefined && (el.inputmask !== undefined && (el.inputmask.opts.autoUnmask = !0,
                            el.inputmask.remove()), el.inputmask = new Inputmask(undefined, undefined, !0),
                            el.inputmask.opts = scopedOpts, el.inputmask.noMasksCache = that.noMasksCache, el.inputmask.userOptions = $.extend(!0, {}, that.userOptions),
                            el.inputmask.isRTL = scopedOpts.isRTL || scopedOpts.numericInput, el.inputmask.el = el,
                            el.inputmask.maskset = maskset, $.data(el, "_inputmask_opts", scopedOpts), maskScope.call(el.inputmask, {
                            action: "mask"
                        }));
                    }
                }), elems && elems[0] && elems[0].inputmask || this;
            },
            option: function(options, noremask) {
                return "string" == typeof options ? this.opts[options] : "object" === (void 0 === options ? "undefined" : _typeof(options)) ? ($.extend(this.userOptions, options),
                this.el && !0 !== noremask && this.mask(this.el), this) : void 0;
            },
            unmaskedvalue: function(value) {
                return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                    maskScope.call(this, {
                        action: "unmaskedvalue",
                        value: value
                    });
            },
            remove: function() {
                return maskScope.call(this, {
                    action: "remove"
                });
            },
            getemptymask: function() {
                return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                    maskScope.call(this, {
                        action: "getemptymask"
                    });
            },
            hasMaskedValue: function() {
                return !this.opts.autoUnmask;
            },
            isComplete: function() {
                return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                    maskScope.call(this, {
                        action: "isComplete"
                    });
            },
            getmetadata: function() {
                return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                    maskScope.call(this, {
                        action: "getmetadata"
                    });
            },
            isValid: function(value) {
                return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                    maskScope.call(this, {
                        action: "isValid",
                        value: value
                    });
            },
            format: function(value, metadata) {
                return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                    maskScope.call(this, {
                        action: "format",
                        value: value,
                        metadata: metadata
                    });
            },
            analyseMask: function(mask, regexMask, opts) {
                var match, m, openingToken, currentOpeningToken, alternator, lastMatch, groupToken, tokenizer = /(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?(?:\|[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g, regexTokenizer = /\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g, escaped = !1, currentToken = new MaskToken(), openenings = [], maskTokens = [];
                function MaskToken(isGroup, isOptional, isQuantifier, isAlternator) {
                    this.matches = [], this.openGroup = isGroup || !1, this.alternatorGroup = !1, this.isGroup = isGroup || !1,
                        this.isOptional = isOptional || !1, this.isQuantifier = isQuantifier || !1, this.isAlternator = isAlternator || !1,
                        this.quantifier = {
                            min: 1,
                            max: 1
                        };
                }
                function insertTestDefinition(mtoken, element, position) {
                    position = position !== undefined ? position : mtoken.matches.length;
                    var prevMatch = mtoken.matches[position - 1];
                    if (regexMask) 0 === element.indexOf("[") || escaped && /\\d|\\s|\\w]/i.test(element) || "." === element ? mtoken.matches.splice(position++, 0, {
                        fn: new RegExp(element, opts.casing ? "i" : ""),
                        optionality: mtoken.isOptional,
                        newBlockMarker: prevMatch === undefined || prevMatch.def !== element,
                        casing: null,
                        def: element,
                        placeholder: undefined,
                        nativeDef: element
                    }) : (escaped && (element = element[element.length - 1]), $.each(element.split(""), function(ndx, lmnt) {
                        prevMatch = mtoken.matches[position - 1], mtoken.matches.splice(position++, 0, {
                            fn: null,
                            optionality: mtoken.isOptional,
                            newBlockMarker: prevMatch === undefined || prevMatch.def !== lmnt && null !== prevMatch.fn,
                            casing: null,
                            def: opts.staticDefinitionSymbol || lmnt,
                            placeholder: opts.staticDefinitionSymbol !== undefined ? lmnt : undefined,
                            nativeDef: lmnt
                        });
                    })), escaped = !1; else {
                        var maskdef = (opts.definitions ? opts.definitions[element] : undefined) || Inputmask.prototype.definitions[element];
                        maskdef && !escaped ? mtoken.matches.splice(position++, 0, {
                            fn: maskdef.validator ? "string" == typeof maskdef.validator ? new RegExp(maskdef.validator, opts.casing ? "i" : "") : new function() {
                                this.test = maskdef.validator;
                            }() : new RegExp("."),
                            optionality: mtoken.isOptional,
                            newBlockMarker: prevMatch === undefined || prevMatch.def !== (maskdef.definitionSymbol || element),
                            casing: maskdef.casing,
                            def: maskdef.definitionSymbol || element,
                            placeholder: maskdef.placeholder,
                            nativeDef: element
                        }) : (mtoken.matches.splice(position++, 0, {
                            fn: null,
                            optionality: mtoken.isOptional,
                            newBlockMarker: prevMatch === undefined || prevMatch.def !== element && null !== prevMatch.fn,
                            casing: null,
                            def: opts.staticDefinitionSymbol || element,
                            placeholder: opts.staticDefinitionSymbol !== undefined ? element : undefined,
                            nativeDef: element
                        }), escaped = !1);
                    }
                }
                function defaultCase() {
                    if (openenings.length > 0) {
                        if (insertTestDefinition(currentOpeningToken = openenings[openenings.length - 1], m),
                                currentOpeningToken.isAlternator) {
                            alternator = openenings.pop();
                            for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;
                            openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1]).matches.push(alternator) : currentToken.matches.push(alternator);
                        }
                    } else insertTestDefinition(currentToken, m);
                }
                for (regexMask && (opts.optionalmarker[0] = undefined, opts.optionalmarker[1] = undefined); match = regexMask ? regexTokenizer.exec(mask) : tokenizer.exec(mask); ) {
                    if (m = match[0], regexMask) switch (m.charAt(0)) {
                        case "?":
                            m = "{0,1}";
                            break;

                        case "+":
                        case "*":
                            m = "{" + m + "}";
                    }
                    if (escaped) defaultCase(); else switch (m.charAt(0)) {
                        case opts.escapeChar:
                            escaped = !0, regexMask && defaultCase();
                            break;

                        case opts.optionalmarker[1]:
                        case opts.groupmarker[1]:
                            if ((openingToken = openenings.pop()).openGroup = !1, openingToken !== undefined) if (openenings.length > 0) {
                                if ((currentOpeningToken = openenings[openenings.length - 1]).matches.push(openingToken),
                                        currentOpeningToken.isAlternator) {
                                    alternator = openenings.pop();
                                    for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1,
                                        alternator.matches[mndx].alternatorGroup = !1;
                                    openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1]).matches.push(alternator) : currentToken.matches.push(alternator);
                                }
                            } else currentToken.matches.push(openingToken); else defaultCase();
                            break;

                        case opts.optionalmarker[0]:
                            openenings.push(new MaskToken(!1, !0));
                            break;

                        case opts.groupmarker[0]:
                            openenings.push(new MaskToken(!0));
                            break;

                        case opts.quantifiermarker[0]:
                            var quantifier = new MaskToken(!1, !1, !0), mqj = (m = m.replace(/[{}]/g, "")).split("|"), mq = mqj[0].split(","), mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]), mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);
                            if ("*" !== mq1 && "+" !== mq1 || (mq0 = "*" === mq1 ? 0 : 1), quantifier.quantifier = {
                                    min: mq0,
                                    max: mq1,
                                    jit: mqj[1]
                                }, openenings.length > 0) {
                                var matches = openenings[openenings.length - 1].matches;
                                (match = matches.pop()).isGroup || ((groupToken = new MaskToken(!0)).matches.push(match),
                                    match = groupToken), matches.push(match), matches.push(quantifier);
                            } else (match = currentToken.matches.pop()).isGroup || (regexMask && null === match.fn && "." === match.def && (match.fn = new RegExp(match.def, opts.casing ? "i" : "")),
                                (groupToken = new MaskToken(!0)).matches.push(match), match = groupToken), currentToken.matches.push(match),
                                currentToken.matches.push(quantifier);
                            break;

                        case opts.alternatormarker:
                            if (openenings.length > 0) {
                                var subToken = (currentOpeningToken = openenings[openenings.length - 1]).matches[currentOpeningToken.matches.length - 1];
                                lastMatch = currentOpeningToken.openGroup && (subToken.matches === undefined || !1 === subToken.isGroup && !1 === subToken.isAlternator) ? openenings.pop() : currentOpeningToken.matches.pop();
                            } else lastMatch = currentToken.matches.pop();
                            if (lastMatch.isAlternator) openenings.push(lastMatch); else if (lastMatch.alternatorGroup ? (alternator = openenings.pop(),
                                    lastMatch.alternatorGroup = !1) : alternator = new MaskToken(!1, !1, !1, !0), alternator.matches.push(lastMatch),
                                    openenings.push(alternator), lastMatch.openGroup) {
                                lastMatch.openGroup = !1;
                                var alternatorGroup = new MaskToken(!0);
                                alternatorGroup.alternatorGroup = !0, openenings.push(alternatorGroup);
                            }
                            break;

                        default:
                            defaultCase();
                    }
                }
                for (;openenings.length > 0; ) openingToken = openenings.pop(), currentToken.matches.push(openingToken);
                return currentToken.matches.length > 0 && (!function verifyGroupMarker(maskToken) {
                    maskToken && maskToken.matches && $.each(maskToken.matches, function(ndx, token) {
                        var nextToken = maskToken.matches[ndx + 1];
                        (nextToken === undefined || nextToken.matches === undefined || !1 === nextToken.isQuantifier) && token && token.isGroup && (token.isGroup = !1,
                        regexMask || (insertTestDefinition(token, opts.groupmarker[0], 0), !0 !== token.openGroup && insertTestDefinition(token, opts.groupmarker[1]))),
                            verifyGroupMarker(token);
                    });
                }(currentToken), maskTokens.push(currentToken)), (opts.numericInput || opts.isRTL) && function reverseTokens(maskToken) {
                    for (var match in maskToken.matches = maskToken.matches.reverse(), maskToken.matches) if (maskToken.matches.hasOwnProperty(match)) {
                        var intMatch = parseInt(match);
                        if (maskToken.matches[match].isQuantifier && maskToken.matches[intMatch + 1] && maskToken.matches[intMatch + 1].isGroup) {
                            var qt = maskToken.matches[match];
                            maskToken.matches.splice(match, 1), maskToken.matches.splice(intMatch + 1, 0, qt);
                        }
                        maskToken.matches[match].matches !== undefined ? maskToken.matches[match] = reverseTokens(maskToken.matches[match]) : maskToken.matches[match] = ((st = maskToken.matches[match]) === opts.optionalmarker[0] ? st = opts.optionalmarker[1] : st === opts.optionalmarker[1] ? st = opts.optionalmarker[0] : st === opts.groupmarker[0] ? st = opts.groupmarker[1] : st === opts.groupmarker[1] && (st = opts.groupmarker[0]),
                            st);
                    }
                    var st;
                    return maskToken;
                }(maskTokens[0]), maskTokens;
            }
        }, Inputmask.extendDefaults = function(options) {
            $.extend(!0, Inputmask.prototype.defaults, options);
        }, Inputmask.extendDefinitions = function(definition) {
            $.extend(!0, Inputmask.prototype.definitions, definition);
        }, Inputmask.extendAliases = function(alias) {
            $.extend(!0, Inputmask.prototype.aliases, alias);
        }, Inputmask.format = function(value, options, metadata) {
            return Inputmask(options).format(value, metadata);
        }, Inputmask.unmask = function(value, options) {
            return Inputmask(options).unmaskedvalue(value);
        }, Inputmask.isValid = function(value, options) {
            return Inputmask(options).isValid(value);
        }, Inputmask.remove = function(elems) {
            $.each(elems, function(ndx, el) {
                el.inputmask && el.inputmask.remove();
            });
        }, Inputmask.escapeRegex = function(str) {
            return str.replace(new RegExp("(\\" + [ "/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^" ].join("|\\") + ")", "gim"), "\\$1");
        }, Inputmask.keyCode = {
            BACKSPACE: 8,
            BACKSPACE_SAFARI: 127,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            INSERT: 45,
            LEFT: 37,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            RIGHT: 39,
            SPACE: 32,
            TAB: 9,
            UP: 38,
            X: 88,
            CONTROL: 17
        }, Inputmask;
    }, __WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(0), __webpack_require__(5), __webpack_require__(6) ],
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports) {
    module.exports = jQuery;
}, function(module, exports, __webpack_require__) {
    "use strict";
    __webpack_require__(4), __webpack_require__(7), __webpack_require__(8), __webpack_require__(9);
    var _inputmask2 = _interopRequireDefault(__webpack_require__(1)), _inputmask4 = _interopRequireDefault(__webpack_require__(0)), _jquery2 = _interopRequireDefault(__webpack_require__(2));
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }
    _inputmask4.default === _jquery2.default && __webpack_require__(10), window.Inputmask = _inputmask2.default;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
    "function" == typeof Symbol && Symbol.iterator;
    factory = function($, Inputmask) {
        var formatCode = {
            d: [ "[1-9]|[12][0-9]|3[01]", Date.prototype.setDate, "day", Date.prototype.getDate ],
            dd: [ "0[1-9]|[12][0-9]|3[01]", Date.prototype.setDate, "day", function() {
                return pad(Date.prototype.getDate.call(this), 2);
            } ],
            ddd: [ "" ],
            dddd: [ "" ],
            m: [ "[1-9]|1[012]", Date.prototype.setMonth, "month", function() {
                return Date.prototype.getMonth.call(this) + 1;
            } ],
            mm: [ "0[1-9]|1[012]", Date.prototype.setMonth, "month", function() {
                return pad(Date.prototype.getMonth.call(this) + 1, 2);
            } ],
            mmm: [ "" ],
            mmmm: [ "" ],
            yy: [ "[0-9]{2}", Date.prototype.setFullYear, "year", function() {
                return pad(Date.prototype.getFullYear.call(this), 2);
            } ],
            yyyy: [ "[0-9]{4}", Date.prototype.setFullYear, "year", function() {
                return pad(Date.prototype.getFullYear.call(this), 4);
            } ],
            h: [ "[1-9]|1[0-2]", Date.prototype.setHours, "hours", Date.prototype.getHours ],
            hh: [ "0[1-9]|1[0-2]", Date.prototype.setHours, "hours", function() {
                return pad(Date.prototype.getHours.call(this), 2);
            } ],
            hhh: [ "[0-9]+", Date.prototype.setHours, "hours", Date.prototype.getHours ],
            H: [ "1?[0-9]|2[0-3]", Date.prototype.setHours, "hours", Date.prototype.getHours ],
            HH: [ "[01][0-9]|2[0-3]", Date.prototype.setHours, "hours", function() {
                return pad(Date.prototype.getHours.call(this), 2);
            } ],
            HHH: [ "[0-9]+", Date.prototype.setHours, "hours", Date.prototype.getHours ],
            M: [ "[1-5]?[0-9]", Date.prototype.setMinutes, "minutes", Date.prototype.getMinutes ],
            MM: [ "[0-5][0-9]", Date.prototype.setMinutes, "minutes", function() {
                return pad(Date.prototype.getMinutes.call(this), 2);
            } ],
            s: [ "[1-5]?[0-9]", Date.prototype.setSeconds, "seconds", Date.prototype.getSeconds ],
            ss: [ "[0-5][0-9]", Date.prototype.setSeconds, "seconds", function() {
                return pad(Date.prototype.getSeconds.call(this), 2);
            } ],
            l: [ "[0-9]{3}", Date.prototype.setMilliseconds, "milliseconds", function() {
                return pad(Date.prototype.getMilliseconds.call(this), 3);
            } ],
            L: [ "[0-9]{2}", Date.prototype.setMilliseconds, "milliseconds", function() {
                return pad(Date.prototype.getMilliseconds.call(this), 2);
            } ],
            t: [ "[ap]" ],
            tt: [ "[ap]m" ],
            T: [ "[AP]" ],
            TT: [ "[AP]M" ],
            Z: [ "" ],
            o: [ "" ],
            S: [ "" ]
        }, formatAlias = {
            isoDate: "yyyy-mm-dd",
            isoTime: "HH:MM:ss",
            isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
            isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
        };
        function getTokenizer(opts) {
            if (!opts.tokenizer) {
                var tokens = [];
                for (var ndx in formatCode) -1 === tokens.indexOf(ndx[0]) && tokens.push(ndx[0]);
                opts.tokenizer = "(" + tokens.join("+|") + ")+?|.", opts.tokenizer = new RegExp(opts.tokenizer, "g");
            }
            return opts.tokenizer;
        }
        function parse(format, dateObjValue, opts) {
            for (var match, mask = ""; match = getTokenizer(opts).exec(format); ) {
                if (void 0 === dateObjValue) mask += formatCode[match[0]] ? "(" + formatCode[match[0]][0] + ")" : Inputmask.escapeRegex(match[0]); else if (formatCode[match[0]]) mask += formatCode[match[0]][3].call(dateObjValue.date); else mask += match[0];
            }
            return mask;
        }
        function pad(val, len) {
            for (val = String(val), len = len || 2; val.length < len; ) val = "0" + val;
            return val;
        }
        function analyseMask(maskString, format, opts) {
            var targetProp, match, dateOperation, dateObj = {
                date: new Date(1, 0, 1)
            }, mask = maskString;
            function extendYear(year) {
                var correctedyear = 4 === year.length ? year : new Date().getFullYear().toString().substr(0, 4 - year.length) + year;
                return opts.min && opts.min.year && opts.max && opts.max.year ? (correctedyear = correctedyear.replace(/[^0-9]/g, ""),
                    correctedyear += opts.min.year == opts.max.year ? opts.min.year.substr(correctedyear.length) : ("" !== correctedyear && 0 == opts.max.year.indexOf(correctedyear) ? parseInt(opts.max.year) - 1 : parseInt(opts.min.year) + 1).toString().substr(correctedyear.length)) : correctedyear = correctedyear.replace(/[^0-9]/g, "0"),
                    correctedyear;
            }
            function setValue(dateObj, value, opts) {
                "year" === targetProp ? (dateObj[targetProp] = extendYear(value), dateObj["raw" + targetProp] = value) : dateObj[targetProp] = opts.min && value.match(/[^0-9]/) ? opts.min[targetProp] : value,
                void 0 !== dateOperation && dateOperation.call(dateObj.date, "month" == targetProp ? parseInt(dateObj[targetProp]) - 1 : dateObj[targetProp]);
            }
            if ("string" == typeof mask) {
                for (;match = getTokenizer(opts).exec(format); ) {
                    var value = mask.slice(0, match[0].length);
                    formatCode.hasOwnProperty(match[0]) && (targetProp = formatCode[match[0]][2], dateOperation = formatCode[match[0]][1],
                        setValue(dateObj, value, opts)), mask = mask.slice(value.length);
                }
                return dateObj;
            }
        }
        return Inputmask.extendAliases({
            datetime: {
                mask: function(opts) {
                    return formatCode.S = opts.i18n.ordinalSuffix.join("|"), opts.inputFormat = formatAlias[opts.inputFormat] || opts.inputFormat,
                        opts.displayFormat = formatAlias[opts.displayFormat] || opts.displayFormat || opts.inputFormat,
                        opts.outputFormat = formatAlias[opts.outputFormat] || opts.outputFormat || opts.inputFormat,
                        opts.placeholder = "" !== opts.placeholder ? opts.placeholder : opts.inputFormat,
                        opts.min = analyseMask(opts.min, opts.inputFormat, opts), opts.max = analyseMask(opts.max, opts.inputFormat, opts),
                        opts.regex = parse(opts.inputFormat, void 0, opts), null;
                },
                placeholder: "",
                inputFormat: "isoDateTime",
                displayFormat: void 0,
                outputFormat: void 0,
                min: null,
                max: null,
                i18n: {
                    dayNames: [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ],
                    monthNames: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
                    ordinalSuffix: [ "st", "nd", "rd", "th" ]
                },
                postValidation: function(buffer, currentResult, opts) {
                    var result = currentResult, dateParts = analyseMask(buffer.join(""), opts.inputFormat, opts);
                    return result && dateParts.date.getTime() == dateParts.date.getTime() && (result = (result = function(dateParts, currentResult) {
                        return (!isFinite(dateParts.day) || "29" == dateParts.day && !isFinite(dateParts.rawyear) || new Date(dateParts.date.getFullYear(), isFinite(dateParts.month) ? dateParts.month : dateParts.date.getMonth() + 1, 0).getDate() >= dateParts.day) && currentResult;
                    }(dateParts, result)) && function(dateParts, opts) {
                        var result = !0;
                        return opts.min && opts.min.date.getTime() == opts.min.date.getTime() && (result = opts.min.date.getTime() <= dateParts.date.getTime()),
                        result && opts.max && opts.max.date.getTime() == opts.max.date.getTime() && (result = opts.max.date.getTime() >= dateParts.date.getTime()),
                            result;
                    }(dateParts, opts)), result;
                },
                onKeyDown: function(e, buffer, caretPos, opts) {
                    if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                        for (var match, today = new Date(), date = ""; match = getTokenizer(opts).exec(opts.inputFormat); ) "d" === match[0].charAt(0) ? date += pad(today.getDate(), match[0].length) : "m" === match[0].charAt(0) ? date += pad(today.getMonth() + 1, match[0].length) : "yyyy" === match[0] ? date += today.getFullYear().toString() : "y" === match[0].charAt(0) && (date += pad(today.getYear(), match[0].length));
                        this.inputmask._valueSet(date), $(this).trigger("setvalue");
                    }
                },
                onUnMask: function(maskedValue, unmaskedValue, opts) {
                    return parse(opts.outputFormat, analyseMask(maskedValue, opts.inputFormat, opts), opts);
                },
                casing: function(elem, test, pos, validPositions) {
                    return 0 == test.nativeDef.indexOf("[ap]") ? elem.toLowerCase() : 0 == test.nativeDef.indexOf("[AP]") ? elem.toUpperCase() : elem;
                },
                insertMode: !1
            }
        }), Inputmask;
    }, __WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(0), __webpack_require__(1) ],
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_RESULT__;
    "function" == typeof Symbol && Symbol.iterator;
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = function() {
        return window;
    }.call(exports, __webpack_require__, exports, module)) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_RESULT__;
    "function" == typeof Symbol && Symbol.iterator;
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = function() {
        return document;
    }.call(exports, __webpack_require__, exports, module)) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
    "function" == typeof Symbol && Symbol.iterator;
    factory = function($, Inputmask) {
        return Inputmask.extendDefinitions({
            A: {
                validator: "[A-Za-zА-яЁёÀ-ÿµ]",
                casing: "upper"
            },
            "&": {
                validator: "[0-9A-Za-zА-яЁёÀ-ÿµ]",
                casing: "upper"
            },
            "#": {
                validator: "[0-9A-Fa-f]",
                casing: "upper"
            }
        }), Inputmask.extendAliases({
            url: {
                definitions: {
                    i: {
                        validator: "."
                    }
                },
                mask: "(\\http://)|(\\http\\s://)|(ftp://)|(ftp\\s://)i{+}",
                insertMode: !1,
                autoUnmask: !1,
                inputmode: "url"
            },
            ip: {
                mask: "i[i[i]].i[i[i]].i[i[i]].i[i[i]]",
                definitions: {
                    i: {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            return pos - 1 > -1 && "." !== maskset.buffer[pos - 1] ? (chrs = maskset.buffer[pos - 1] + chrs,
                                chrs = pos - 2 > -1 && "." !== maskset.buffer[pos - 2] ? maskset.buffer[pos - 2] + chrs : "0" + chrs) : chrs = "00" + chrs,
                                new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(chrs);
                        }
                    }
                },
                onUnMask: function(maskedValue, unmaskedValue, opts) {
                    return maskedValue;
                },
                inputmode: "numeric"
            },
            email: {
                mask: "*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",
                greedy: !1,
                onBeforePaste: function(pastedValue, opts) {
                    return (pastedValue = pastedValue.toLowerCase()).replace("mailto:", "");
                },
                definitions: {
                    "*": {
                        validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",
                        casing: "lower"
                    },
                    "-": {
                        validator: "[0-9A-Za-z-]",
                        casing: "lower"
                    }
                },
                onUnMask: function(maskedValue, unmaskedValue, opts) {
                    return maskedValue;
                },
                inputmode: "email"
            },
            mac: {
                mask: "##:##:##:##:##:##"
            },
            vin: {
                mask: "V{13}9{4}",
                definitions: {
                    V: {
                        validator: "[A-HJ-NPR-Za-hj-npr-z\\d]",
                        casing: "upper"
                    }
                },
                clearIncomplete: !0,
                autoUnmask: !0
            }
        }), Inputmask;
    }, __WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(0), __webpack_require__(1) ],
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
    "function" == typeof Symbol && Symbol.iterator;
    factory = function($, Inputmask, undefined) {
        function autoEscape(txt, opts) {
            for (var escapedTxt = "", i = 0; i < txt.length; i++) Inputmask.prototype.definitions[txt.charAt(i)] || opts.definitions[txt.charAt(i)] || opts.optionalmarker.start === txt.charAt(i) || opts.optionalmarker.end === txt.charAt(i) || opts.quantifiermarker.start === txt.charAt(i) || opts.quantifiermarker.end === txt.charAt(i) || opts.groupmarker.start === txt.charAt(i) || opts.groupmarker.end === txt.charAt(i) || opts.alternatormarker === txt.charAt(i) ? escapedTxt += "\\" + txt.charAt(i) : escapedTxt += txt.charAt(i);
            return escapedTxt;
        }
        return Inputmask.extendAliases({
            numeric: {
                mask: function(opts) {
                    if (0 !== opts.repeat && isNaN(opts.integerDigits) && (opts.integerDigits = opts.repeat),
                            opts.repeat = 0, opts.groupSeparator === opts.radixPoint && opts.digits && "0" !== opts.digits && ("." === opts.radixPoint ? opts.groupSeparator = "," : "," === opts.radixPoint ? opts.groupSeparator = "." : opts.groupSeparator = ""),
                        " " === opts.groupSeparator && (opts.skipOptionalPartCharacter = undefined), opts.autoGroup = opts.autoGroup && "" !== opts.groupSeparator,
                        opts.autoGroup && ("string" == typeof opts.groupSize && isFinite(opts.groupSize) && (opts.groupSize = parseInt(opts.groupSize)),
                            isFinite(opts.integerDigits))) {
                        var seps = Math.floor(opts.integerDigits / opts.groupSize), mod = opts.integerDigits % opts.groupSize;
                        opts.integerDigits = parseInt(opts.integerDigits) + (0 === mod ? seps - 1 : seps),
                        opts.integerDigits < 1 && (opts.integerDigits = "*");
                    }
                    opts.placeholder.length > 1 && (opts.placeholder = opts.placeholder.charAt(0)),
                    "radixFocus" === opts.positionCaretOnClick && "" === opts.placeholder && !1 === opts.integerOptional && (opts.positionCaretOnClick = "lvp"),
                        opts.definitions[";"] = opts.definitions["~"], opts.definitions[";"].definitionSymbol = "~",
                    !0 === opts.numericInput && (opts.positionCaretOnClick = "radixFocus" === opts.positionCaretOnClick ? "lvp" : opts.positionCaretOnClick,
                        opts.digitsOptional = !1, isNaN(opts.digits) && (opts.digits = 2), opts.decimalProtect = !1);
                    var mask = "[+]";
                    if (mask += autoEscape(opts.prefix, opts), !0 === opts.integerOptional ? mask += "~{1," + opts.integerDigits + "}" : mask += "~{" + opts.integerDigits + "}",
                        opts.digits !== undefined) {
                        var radixDef = opts.decimalProtect ? ":" : opts.radixPoint, dq = opts.digits.toString().split(",");
                        isFinite(dq[0] && dq[1] && isFinite(dq[1])) ? mask += radixDef + ";{" + opts.digits + "}" : (isNaN(opts.digits) || parseInt(opts.digits) > 0) && (opts.digitsOptional ? mask += "[" + radixDef + ";{1," + opts.digits + "}]" : mask += radixDef + ";{" + opts.digits + "}");
                    }
                    return mask += autoEscape(opts.suffix, opts), mask += "[-]", opts.greedy = !1, mask;
                },
                placeholder: "",
                greedy: !1,
                digits: "*",
                digitsOptional: !0,
                enforceDigitsOnBlur: !1,
                radixPoint: ".",
                positionCaretOnClick: "radixFocus",
                groupSize: 3,
                groupSeparator: "",
                autoGroup: !1,
                allowMinus: !0,
                negationSymbol: {
                    front: "-",
                    back: ""
                },
                integerDigits: "+",
                integerOptional: !0,
                prefix: "",
                suffix: "",
                rightAlign: !0,
                decimalProtect: !0,
                min: null,
                max: null,
                step: 1,
                insertMode: !0,
                autoUnmask: !1,
                unmaskAsNumber: !1,
                inputmode: "numeric",
                preValidation: function(buffer, pos, c, isSelection, opts, maskset) {
                    if ("-" === c || c === opts.negationSymbol.front) return !0 === opts.allowMinus && (opts.isNegative = opts.isNegative === undefined || !opts.isNegative,
                    "" === buffer.join("") || {
                        caret: pos,
                        dopost: !0
                    });
                    if (!1 === isSelection && c === opts.radixPoint && opts.digits !== undefined && (isNaN(opts.digits) || parseInt(opts.digits) > 0)) {
                        var radixPos = $.inArray(opts.radixPoint, buffer);
                        if (-1 !== radixPos && maskset.validPositions[radixPos] !== undefined) return !0 === opts.numericInput ? pos === radixPos : {
                            caret: radixPos + 1
                        };
                    }
                    return !0;
                },
                postValidation: function(buffer, currentResult, opts) {
                    var suffix = opts.suffix.split(""), prefix = opts.prefix.split("");
                    if (currentResult.pos === undefined && currentResult.caret !== undefined && !0 !== currentResult.dopost) return currentResult;
                    var caretPos = currentResult.caret !== undefined ? currentResult.caret : currentResult.pos, maskedValue = buffer.slice();
                    opts.numericInput && (caretPos = maskedValue.length - caretPos - 1, maskedValue = maskedValue.reverse());
                    var charAtPos = maskedValue[caretPos];
                    if (charAtPos === opts.groupSeparator && (charAtPos = maskedValue[caretPos += 1]),
                        caretPos === maskedValue.length - opts.suffix.length - 1 && charAtPos === opts.radixPoint) return currentResult;
                    charAtPos !== undefined && charAtPos !== opts.radixPoint && charAtPos !== opts.negationSymbol.front && charAtPos !== opts.negationSymbol.back && (maskedValue[caretPos] = "?",
                        opts.prefix.length > 0 && caretPos >= (!1 === opts.isNegative ? 1 : 0) && caretPos < opts.prefix.length - 1 + (!1 === opts.isNegative ? 1 : 0) ? prefix[caretPos - (!1 === opts.isNegative ? 1 : 0)] = "?" : opts.suffix.length > 0 && caretPos >= maskedValue.length - opts.suffix.length - (!1 === opts.isNegative ? 1 : 0) && (suffix[caretPos - (maskedValue.length - opts.suffix.length - (!1 === opts.isNegative ? 1 : 0))] = "?")),
                        prefix = prefix.join(""), suffix = suffix.join("");
                    var processValue = maskedValue.join("").replace(prefix, "");
                    if (processValue = (processValue = (processValue = (processValue = processValue.replace(suffix, "")).replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), "")).replace(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"), "")).replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""),
                        isNaN(opts.placeholder) && (processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.placeholder), "g"), "")),
                        processValue.length > 1 && 1 !== processValue.indexOf(opts.radixPoint) && ("0" === charAtPos && (processValue = processValue.replace(/^\?/g, "")),
                            processValue = processValue.replace(/^0/g, "")), processValue.charAt(0) === opts.radixPoint && "" !== opts.radixPoint && !0 !== opts.numericInput && (processValue = "0" + processValue),
                        "" !== processValue) {
                        if (processValue = processValue.split(""), (!opts.digitsOptional || opts.enforceDigitsOnBlur && "blur" === currentResult.event) && isFinite(opts.digits)) {
                            var radixPosition = $.inArray(opts.radixPoint, processValue), rpb = $.inArray(opts.radixPoint, maskedValue);
                            -1 === radixPosition && (processValue.push(opts.radixPoint), radixPosition = processValue.length - 1);
                            for (var i = 1; i <= opts.digits; i++) opts.digitsOptional && (!opts.enforceDigitsOnBlur || "blur" !== currentResult.event) || processValue[radixPosition + i] !== undefined && processValue[radixPosition + i] !== opts.placeholder.charAt(0) ? -1 !== rpb && maskedValue[rpb + i] !== undefined && (processValue[radixPosition + i] = processValue[radixPosition + i] || maskedValue[rpb + i]) : processValue[radixPosition + i] = currentResult.placeholder || opts.placeholder.charAt(0);
                        }
                        if (!0 !== opts.autoGroup || "" === opts.groupSeparator || charAtPos === opts.radixPoint && currentResult.pos === undefined && !currentResult.dopost) processValue = processValue.join(""); else {
                            var addRadix = processValue[processValue.length - 1] === opts.radixPoint && currentResult.c === opts.radixPoint;
                            processValue = Inputmask(function(buffer, opts) {
                                var postMask = "";
                                if (postMask += "(" + opts.groupSeparator + "*{" + opts.groupSize + "}){*}", "" !== opts.radixPoint) {
                                    var radixSplit = buffer.join("").split(opts.radixPoint);
                                    radixSplit[1] && (postMask += opts.radixPoint + "*{" + radixSplit[1].match(/^\d*\??\d*/)[0].length + "}");
                                }
                                return postMask;
                            }(processValue, opts), {
                                numericInput: !0,
                                jitMasking: !0,
                                definitions: {
                                    "*": {
                                        validator: "[0-9?]",
                                        cardinality: 1
                                    }
                                }
                            }).format(processValue.join("")), addRadix && (processValue += opts.radixPoint),
                            processValue.charAt(0) === opts.groupSeparator && processValue.substr(1);
                        }
                    }
                    if (opts.isNegative && "blur" === currentResult.event && (opts.isNegative = "0" !== processValue),
                            processValue = prefix + processValue, processValue += suffix, opts.isNegative && (processValue = opts.negationSymbol.front + processValue,
                            processValue += opts.negationSymbol.back), processValue = processValue.split(""),
                        charAtPos !== undefined) if (charAtPos !== opts.radixPoint && charAtPos !== opts.negationSymbol.front && charAtPos !== opts.negationSymbol.back) (caretPos = $.inArray("?", processValue)) > -1 ? processValue[caretPos] = charAtPos : caretPos = currentResult.caret || 0; else if (charAtPos === opts.radixPoint || charAtPos === opts.negationSymbol.front || charAtPos === opts.negationSymbol.back) {
                        var newCaretPos = $.inArray(charAtPos, processValue);
                        -1 !== newCaretPos && (caretPos = newCaretPos);
                    }
                    opts.numericInput && (caretPos = processValue.length - caretPos - 1, processValue = processValue.reverse());
                    var rslt = {
                        caret: charAtPos === undefined || currentResult.pos !== undefined ? caretPos + (opts.numericInput ? -1 : 1) : caretPos,
                        buffer: processValue,
                        refreshFromBuffer: currentResult.dopost || buffer.join("") !== processValue.join("")
                    };
                    return rslt.refreshFromBuffer ? rslt : currentResult;
                },
                onBeforeWrite: function(e, buffer, caretPos, opts) {
                    if (e) switch (e.type) {
                        case "keydown":
                            return opts.postValidation(buffer, {
                                caret: caretPos,
                                dopost: !0
                            }, opts);

                        case "blur":
                        case "checkval":
                            var unmasked;
                            if (function(opts) {
                                    opts.parseMinMaxOptions === undefined && (null !== opts.min && (opts.min = opts.min.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                                    "," === opts.radixPoint && (opts.min = opts.min.replace(opts.radixPoint, ".")),
                                        opts.min = isFinite(opts.min) ? parseFloat(opts.min) : NaN, isNaN(opts.min) && (opts.min = Number.MIN_VALUE)),
                                    null !== opts.max && (opts.max = opts.max.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                                    "," === opts.radixPoint && (opts.max = opts.max.replace(opts.radixPoint, ".")),
                                        opts.max = isFinite(opts.max) ? parseFloat(opts.max) : NaN, isNaN(opts.max) && (opts.max = Number.MAX_VALUE)),
                                        opts.parseMinMaxOptions = "done");
                                }(opts), null !== opts.min || null !== opts.max) {
                                if (unmasked = opts.onUnMask(buffer.join(""), undefined, $.extend({}, opts, {
                                        unmaskAsNumber: !0
                                    })), null !== opts.min && unmasked < opts.min) return opts.isNegative = opts.min < 0,
                                    opts.postValidation(opts.min.toString().replace(".", opts.radixPoint).split(""), {
                                        caret: caretPos,
                                        dopost: !0,
                                        placeholder: "0"
                                    }, opts);
                                if (null !== opts.max && unmasked > opts.max) return opts.isNegative = opts.max < 0,
                                    opts.postValidation(opts.max.toString().replace(".", opts.radixPoint).split(""), {
                                        caret: caretPos,
                                        dopost: !0,
                                        placeholder: "0"
                                    }, opts);
                            }
                            return opts.postValidation(buffer, {
                                caret: caretPos,
                                placeholder: "0",
                                event: "blur"
                            }, opts);

                        case "_checkval":
                            return {
                                caret: caretPos
                            };
                    }
                },
                regex: {
                    integerPart: function(opts, emptyCheck) {
                        return emptyCheck ? new RegExp("[" + Inputmask.escapeRegex(opts.negationSymbol.front) + "+]?") : new RegExp("[" + Inputmask.escapeRegex(opts.negationSymbol.front) + "+]?\\d+");
                    },
                    integerNPart: function(opts) {
                        return new RegExp("[\\d" + Inputmask.escapeRegex(opts.groupSeparator) + Inputmask.escapeRegex(opts.placeholder.charAt(0)) + "]+");
                    }
                },
                definitions: {
                    "~": {
                        validator: function(chrs, maskset, pos, strict, opts, isSelection) {
                            var isValid = strict ? new RegExp("[0-9" + Inputmask.escapeRegex(opts.groupSeparator) + "]").test(chrs) : new RegExp("[0-9]").test(chrs);
                            if (!0 === isValid) {
                                if (!0 !== opts.numericInput && maskset.validPositions[pos] !== undefined && "~" === maskset.validPositions[pos].match.def && !isSelection) {
                                    var processValue = maskset.buffer.join(""), pvRadixSplit = (processValue = (processValue = processValue.replace(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"), "")).replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), "")).split(opts.radixPoint);
                                    pvRadixSplit.length > 1 && (pvRadixSplit[1] = pvRadixSplit[1].replace(/0/g, opts.placeholder.charAt(0))),
                                    "0" === pvRadixSplit[0] && (pvRadixSplit[0] = pvRadixSplit[0].replace(/0/g, opts.placeholder.charAt(0))),
                                        processValue = pvRadixSplit[0] + opts.radixPoint + pvRadixSplit[1] || "";
                                    var bufferTemplate = maskset._buffer.join("");
                                    for (processValue === opts.radixPoint && (processValue = bufferTemplate); null === processValue.match(Inputmask.escapeRegex(bufferTemplate) + "$"); ) bufferTemplate = bufferTemplate.slice(1);
                                    isValid = (processValue = (processValue = processValue.replace(bufferTemplate, "")).split(""))[pos] === undefined ? {
                                        pos: pos,
                                        remove: pos
                                    } : {
                                        pos: pos
                                    };
                                }
                            } else strict || chrs !== opts.radixPoint || maskset.validPositions[pos - 1] !== undefined || (maskset.buffer[pos] = "0",
                                isValid = {
                                    pos: pos + 1
                                });
                            return isValid;
                        },
                        cardinality: 1
                    },
                    "+": {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            return opts.allowMinus && ("-" === chrs || chrs === opts.negationSymbol.front);
                        },
                        cardinality: 1,
                        placeholder: ""
                    },
                    "-": {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            return opts.allowMinus && chrs === opts.negationSymbol.back;
                        },
                        cardinality: 1,
                        placeholder: ""
                    },
                    ":": {
                        validator: function(chrs, maskset, pos, strict, opts) {
                            var radix = "[" + Inputmask.escapeRegex(opts.radixPoint) + "]", isValid = new RegExp(radix).test(chrs);
                            return isValid && maskset.validPositions[pos] && maskset.validPositions[pos].match.placeholder === opts.radixPoint && (isValid = {
                                caret: pos + 1
                            }), isValid;
                        },
                        cardinality: 1,
                        placeholder: function(opts) {
                            return opts.radixPoint;
                        }
                    }
                },
                onUnMask: function(maskedValue, unmaskedValue, opts) {
                    if ("" === unmaskedValue && !0 === opts.nullable) return unmaskedValue;
                    var processValue = maskedValue.replace(opts.prefix, "");
                    return processValue = (processValue = processValue.replace(opts.suffix, "")).replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                    "" !== opts.placeholder.charAt(0) && (processValue = processValue.replace(new RegExp(opts.placeholder.charAt(0), "g"), "0")),
                        opts.unmaskAsNumber ? ("" !== opts.radixPoint && -1 !== processValue.indexOf(opts.radixPoint) && (processValue = processValue.replace(Inputmask.escapeRegex.call(this, opts.radixPoint), ".")),
                            processValue = (processValue = processValue.replace(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)), "-")).replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""),
                            Number(processValue)) : processValue;
                },
                isComplete: function(buffer, opts) {
                    var maskedValue = buffer.join("");
                    if (buffer.slice().join("") !== maskedValue) return !1;
                    var processValue = maskedValue.replace(opts.prefix, "");
                    return processValue = (processValue = processValue.replace(opts.suffix, "")).replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator) + "([0-9]{3})", "g"), "$1"),
                    "," === opts.radixPoint && (processValue = processValue.replace(Inputmask.escapeRegex(opts.radixPoint), ".")),
                        isFinite(processValue);
                },
                onBeforeMask: function(initialValue, opts) {
                    if (opts.isNegative = undefined, initialValue = initialValue.toString().charAt(initialValue.length - 1) === opts.radixPoint ? initialValue.toString().substr(0, initialValue.length - 1) : initialValue.toString(),
                        "" !== opts.radixPoint && isFinite(initialValue)) {
                        var vs = initialValue.split("."), groupSize = "" !== opts.groupSeparator ? parseInt(opts.groupSize) : 0;
                        2 === vs.length && (vs[0].length > groupSize || vs[1].length > groupSize || vs[0].length <= groupSize && vs[1].length < groupSize) && (initialValue = initialValue.replace(".", opts.radixPoint));
                    }
                    var kommaMatches = initialValue.match(/,/g), dotMatches = initialValue.match(/\./g);
                    if (initialValue = dotMatches && kommaMatches ? dotMatches.length > kommaMatches.length ? (initialValue = initialValue.replace(/\./g, "")).replace(",", opts.radixPoint) : kommaMatches.length > dotMatches.length ? (initialValue = initialValue.replace(/,/g, "")).replace(".", opts.radixPoint) : initialValue.indexOf(".") < initialValue.indexOf(",") ? initialValue.replace(/\./g, "") : initialValue.replace(/,/g, "") : initialValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                        0 === opts.digits && (-1 !== initialValue.indexOf(".") ? initialValue = initialValue.substring(0, initialValue.indexOf(".")) : -1 !== initialValue.indexOf(",") && (initialValue = initialValue.substring(0, initialValue.indexOf(",")))),
                        "" !== opts.radixPoint && isFinite(opts.digits) && -1 !== initialValue.indexOf(opts.radixPoint)) {
                        var decPart = initialValue.split(opts.radixPoint)[1].match(new RegExp("\\d*"))[0];
                        if (parseInt(opts.digits) < decPart.toString().length) {
                            var digitsFactor = Math.pow(10, parseInt(opts.digits));
                            initialValue = initialValue.replace(Inputmask.escapeRegex(opts.radixPoint), "."),
                                initialValue = (initialValue = Math.round(parseFloat(initialValue) * digitsFactor) / digitsFactor).toString().replace(".", opts.radixPoint);
                        }
                    }
                    return initialValue;
                },
                canClearPosition: function(maskset, position, lvp, strict, opts) {
                    var vp = maskset.validPositions[position], canClear = vp.input !== opts.radixPoint || null !== maskset.validPositions[position].match.fn && !1 === opts.decimalProtect || vp.input === opts.radixPoint && maskset.validPositions[position + 1] && null === maskset.validPositions[position + 1].match.fn || isFinite(vp.input) || position === lvp || vp.input === opts.groupSeparator || vp.input === opts.negationSymbol.front || vp.input === opts.negationSymbol.back;
                    return !canClear || "+" !== vp.match.nativeDef && "-" !== vp.match.nativeDef || (opts.isNegative = !1),
                        canClear;
                },
                onKeyDown: function(e, buffer, caretPos, opts) {
                    var $input = $(this);
                    if (e.ctrlKey) switch (e.keyCode) {
                        case Inputmask.keyCode.UP:
                            $input.val(parseFloat(this.inputmask.unmaskedvalue()) + parseInt(opts.step)), $input.trigger("setvalue");
                            break;

                        case Inputmask.keyCode.DOWN:
                            $input.val(parseFloat(this.inputmask.unmaskedvalue()) - parseInt(opts.step)), $input.trigger("setvalue");
                    }
                }
            },
            currency: {
                prefix: "$ ",
                groupSeparator: ",",
                alias: "numeric",
                placeholder: "0",
                autoGroup: !0,
                digits: 2,
                digitsOptional: !1,
                clearMaskOnLostFocus: !1
            },
            decimal: {
                alias: "numeric"
            },
            integer: {
                alias: "numeric",
                digits: 0,
                radixPoint: ""
            },
            percentage: {
                alias: "numeric",
                digits: 2,
                digitsOptional: !0,
                radixPoint: ".",
                placeholder: "0",
                autoGroup: !1,
                min: 0,
                max: 100,
                suffix: " %",
                allowMinus: !1
            }
        }), Inputmask;
    }, __WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(0), __webpack_require__(1) ],
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
    "function" == typeof Symbol && Symbol.iterator;
    factory = function($, Inputmask) {
        function maskSort(a, b) {
            var maska = (a.mask || a).replace(/#/g, "0").replace(/\)/, "0").replace(/[+()#-]/g, ""), maskb = (b.mask || b).replace(/#/g, "0").replace(/\)/, "0").replace(/[+()#-]/g, "");
            return maska.localeCompare(maskb);
        }
        var analyseMaskBase = Inputmask.prototype.analyseMask;
        return Inputmask.prototype.analyseMask = function(mask, regexMask, opts) {
            var maskGroups = {};
            return opts.phoneCodes && (opts.phoneCodes && opts.phoneCodes.length > 1e3 && (function reduceVariations(masks, previousVariation, previousmaskGroup) {
                previousVariation = previousVariation || "", previousmaskGroup = previousmaskGroup || maskGroups,
                "" !== previousVariation && (previousmaskGroup[previousVariation] = {});
                for (var variation = "", maskGroup = previousmaskGroup[previousVariation] || previousmaskGroup, i = masks.length - 1; i >= 0; i--) maskGroup[variation = (mask = masks[i].mask || masks[i]).substr(0, 1)] = maskGroup[variation] || [],
                    maskGroup[variation].unshift(mask.substr(1)), masks.splice(i, 1);
                for (var ndx in maskGroup) maskGroup[ndx].length > 500 && reduceVariations(maskGroup[ndx].slice(), ndx, maskGroup);
            }((mask = mask.substr(1, mask.length - 2)).split(opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0])),
                mask = function rebuild(maskGroup) {
                    var mask = "", submasks = [];
                    for (var ndx in maskGroup) $.isArray(maskGroup[ndx]) ? 1 === maskGroup[ndx].length ? submasks.push(ndx + maskGroup[ndx]) : submasks.push(ndx + opts.groupmarker[0] + maskGroup[ndx].join(opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0]) + opts.groupmarker[1]) : submasks.push(ndx + rebuild(maskGroup[ndx]));
                    return 1 === submasks.length ? mask += submasks[0] : mask += opts.groupmarker[0] + submasks.join(opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0]) + opts.groupmarker[1],
                        mask;
                }(maskGroups)), mask = mask.replace(/9/g, "\\9")), analyseMaskBase.call(this, mask, regexMask, opts);
        }, Inputmask.extendAliases({
            abstractphone: {
                groupmarker: [ "<", ">" ],
                countrycode: "",
                phoneCodes: [],
                keepStatic: "auto",
                mask: function(opts) {
                    return opts.definitions = {
                        "#": Inputmask.prototype.definitions[9]
                    }, opts.phoneCodes.sort(maskSort);
                },
                onBeforeMask: function(value, opts) {
                    var processedValue = value.replace(/^0{1,2}/, "").replace(/[\s]/g, "");
                    return (processedValue.indexOf(opts.countrycode) > 1 || -1 === processedValue.indexOf(opts.countrycode)) && (processedValue = "+" + opts.countrycode + processedValue),
                        processedValue;
                },
                onUnMask: function(maskedValue, unmaskedValue, opts) {
                    return maskedValue.replace(/[()#-]/g, "");
                },
                inputmode: "tel"
            }
        }), Inputmask;
    }, __WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(0), __webpack_require__(1) ],
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory, _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    factory = function($, Inputmask) {
        return void 0 === $.fn.inputmask && ($.fn.inputmask = function(fn, options) {
            var nptmask, input = this[0];
            if (void 0 === options && (options = {}), "string" == typeof fn) switch (fn) {
                case "unmaskedvalue":
                    return input && input.inputmask ? input.inputmask.unmaskedvalue() : $(input).val();

                case "remove":
                    return this.each(function() {
                        this.inputmask && this.inputmask.remove();
                    });

                case "getemptymask":
                    return input && input.inputmask ? input.inputmask.getemptymask() : "";

                case "hasMaskedValue":
                    return !(!input || !input.inputmask) && input.inputmask.hasMaskedValue();

                case "isComplete":
                    return !input || !input.inputmask || input.inputmask.isComplete();

                case "getmetadata":
                    return input && input.inputmask ? input.inputmask.getmetadata() : void 0;

                case "setvalue":
                    $(input).val(options), input && void 0 === input.inputmask && $(input).triggerHandler("setvalue");
                    break;

                case "option":
                    if ("string" != typeof options) return this.each(function() {
                        if (void 0 !== this.inputmask) return this.inputmask.option(options);
                    });
                    if (input && void 0 !== input.inputmask) return input.inputmask.option(options);
                    break;

                default:
                    return options.alias = fn, nptmask = new Inputmask(options), this.each(function() {
                        nptmask.mask(this);
                    });
            } else {
                if ("object" == (void 0 === fn ? "undefined" : _typeof(fn))) return nptmask = new Inputmask(fn),
                    void 0 === fn.mask && void 0 === fn.alias ? this.each(function() {
                        if (void 0 !== this.inputmask) return this.inputmask.option(fn);
                        nptmask.mask(this);
                    }) : this.each(function() {
                        nptmask.mask(this);
                    });
                if (void 0 === fn) return this.each(function() {
                    (nptmask = new Inputmask(options)).mask(this);
                });
            }
        }), $.fn.inputmask;
    }, __WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(2), __webpack_require__(1) ],
    void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
} ]);
},{}],7:[function(require,module,exports){
(function(t){t.extend(t.fn,{validate:function(e){if(!this.length)return e&&e.debug&&window.console&&console.warn("Nothing selected, can't validate, returning nothing."),void 0;var i=t.data(this[0],"validator");return i?i:(this.attr("novalidate","novalidate"),i=new t.validator(e,this[0]),t.data(this[0],"validator",i),i.settings.onsubmit&&(this.validateDelegate(":submit","click",function(e){i.settings.submitHandler&&(i.submitButton=e.target),t(e.target).hasClass("cancel")&&(i.cancelSubmit=!0),void 0!==t(e.target).attr("formnovalidate")&&(i.cancelSubmit=!0)}),this.submit(function(e){function s(){var s;return i.settings.submitHandler?(i.submitButton&&(s=t("<input type='hidden'/>").attr("name",i.submitButton.name).val(t(i.submitButton).val()).appendTo(i.currentForm)),i.settings.submitHandler.call(i,i.currentForm,e),i.submitButton&&s.remove(),!1):!0}return i.settings.debug&&e.preventDefault(),i.cancelSubmit?(i.cancelSubmit=!1,s()):i.form()?i.pendingRequest?(i.formSubmitted=!0,!1):s():(i.focusInvalid(),!1)})),i)},valid:function(){if(t(this[0]).is("form"))return this.validate().form();var e=!0,i=t(this[0].form).validate();return this.each(function(){e=e&&i.element(this)}),e},removeAttrs:function(e){var i={},s=this;return t.each(e.split(/\s/),function(t,e){i[e]=s.attr(e),s.removeAttr(e)}),i},rules:function(e,i){var s=this[0];if(e){var r=t.data(s.form,"validator").settings,n=r.rules,a=t.validator.staticRules(s);switch(e){case"add":t.extend(a,t.validator.normalizeRule(i)),delete a.messages,n[s.name]=a,i.messages&&(r.messages[s.name]=t.extend(r.messages[s.name],i.messages));break;case"remove":if(!i)return delete n[s.name],a;var u={};return t.each(i.split(/\s/),function(t,e){u[e]=a[e],delete a[e]}),u}}var o=t.validator.normalizeRules(t.extend({},t.validator.classRules(s),t.validator.attributeRules(s),t.validator.dataRules(s),t.validator.staticRules(s)),s);if(o.required){var l=o.required;delete o.required,o=t.extend({required:l},o)}return o}}),t.extend(t.expr[":"],{blank:function(e){return!t.trim(""+t(e).val())},filled:function(e){return!!t.trim(""+t(e).val())},unchecked:function(e){return!t(e).prop("checked")}}),t.validator=function(e,i){this.settings=t.extend(!0,{},t.validator.defaults,e),this.currentForm=i,this.init()},t.validator.format=function(e,i){return 1===arguments.length?function(){var i=t.makeArray(arguments);return i.unshift(e),t.validator.format.apply(this,i)}:(arguments.length>2&&i.constructor!==Array&&(i=t.makeArray(arguments).slice(1)),i.constructor!==Array&&(i=[i]),t.each(i,function(t,i){e=e.replace(RegExp("\\{"+t+"\\}","g"),function(){return i})}),e)},t.extend(t.validator,{defaults:{messages:{},groups:{},rules:{},errorClass:"error",validClass:"valid",errorElement:"label",focusInvalid:!0,errorContainer:t([]),errorLabelContainer:t([]),onsubmit:!0,ignore:":hidden",ignoreTitle:!1,onfocusin:function(t){this.lastActive=t,this.settings.focusCleanup&&!this.blockFocusCleanup&&(this.settings.unhighlight&&this.settings.unhighlight.call(this,t,this.settings.errorClass,this.settings.validClass),this.addWrapper(this.errorsFor(t)).hide())},onfocusout:function(t){this.checkable(t)||!(t.name in this.submitted)&&this.optional(t)||this.element(t)},onkeyup:function(t,e){(9!==e.which||""!==this.elementValue(t))&&(t.name in this.submitted||t===this.lastElement)&&this.element(t)},onclick:function(t){t.name in this.submitted?this.element(t):t.parentNode.name in this.submitted&&this.element(t.parentNode)},highlight:function(e,i,s){"radio"===e.type?this.findByName(e.name).addClass(i).removeClass(s):t(e).addClass(i).removeClass(s)},unhighlight:function(e,i,s){"radio"===e.type?this.findByName(e.name).removeClass(i).addClass(s):t(e).removeClass(i).addClass(s)}},setDefaults:function(e){t.extend(t.validator.defaults,e)},messages:{required:"This field is required.",remote:"Please fix this field.",email:"Please enter a valid email address.",url:"Please enter a valid URL.",date:"Please enter a valid date.",dateISO:"Please enter a valid date (ISO).",number:"Please enter a valid number.",digits:"Please enter only digits.",creditcard:"Please enter a valid credit card number.",equalTo:"Please enter the same value again.",maxlength:t.validator.format("Please enter no more than {0} characters."),minlength:t.validator.format("Please enter at least {0} characters."),rangelength:t.validator.format("Please enter a value between {0} and {1} characters long."),range:t.validator.format("Please enter a value between {0} and {1}."),max:t.validator.format("Please enter a value less than or equal to {0}."),min:t.validator.format("Please enter a value greater than or equal to {0}.")},autoCreateRanges:!1,prototype:{init:function(){function e(e){var i=t.data(this[0].form,"validator"),s="on"+e.type.replace(/^validate/,"");i.settings[s]&&i.settings[s].call(i,this[0],e)}this.labelContainer=t(this.settings.errorLabelContainer),this.errorContext=this.labelContainer.length&&this.labelContainer||t(this.currentForm),this.containers=t(this.settings.errorContainer).add(this.settings.errorLabelContainer),this.submitted={},this.valueCache={},this.pendingRequest=0,this.pending={},this.invalid={},this.reset();var i=this.groups={};t.each(this.settings.groups,function(e,s){"string"==typeof s&&(s=s.split(/\s/)),t.each(s,function(t,s){i[s]=e})});var s=this.settings.rules;t.each(s,function(e,i){s[e]=t.validator.normalizeRule(i)}),t(this.currentForm).validateDelegate(":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'] ,[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], [type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'] ","focusin focusout keyup",e).validateDelegate("[type='radio'], [type='checkbox'], select, option","click",e),this.settings.invalidHandler&&t(this.currentForm).bind("invalid-form.validate",this.settings.invalidHandler)},form:function(){return this.checkForm(),t.extend(this.submitted,this.errorMap),this.invalid=t.extend({},this.errorMap),this.valid()||t(this.currentForm).triggerHandler("invalid-form",[this]),this.showErrors(),this.valid()},checkForm:function(){this.prepareForm();for(var t=0,e=this.currentElements=this.elements();e[t];t++)this.check(e[t]);return this.valid()},element:function(e){e=this.validationTargetFor(this.clean(e)),this.lastElement=e,this.prepareElement(e),this.currentElements=t(e);var i=this.check(e)!==!1;return i?delete this.invalid[e.name]:this.invalid[e.name]=!0,this.numberOfInvalids()||(this.toHide=this.toHide.add(this.containers)),this.showErrors(),i},showErrors:function(e){if(e){t.extend(this.errorMap,e),this.errorList=[];for(var i in e)this.errorList.push({message:e[i],element:this.findByName(i)[0]});this.successList=t.grep(this.successList,function(t){return!(t.name in e)})}this.settings.showErrors?this.settings.showErrors.call(this,this.errorMap,this.errorList):this.defaultShowErrors()},resetForm:function(){t.fn.resetForm&&t(this.currentForm).resetForm(),this.submitted={},this.lastElement=null,this.prepareForm(),this.hideErrors(),this.elements().removeClass(this.settings.errorClass).removeData("previousValue")},numberOfInvalids:function(){return this.objectLength(this.invalid)},objectLength:function(t){var e=0;for(var i in t)e++;return e},hideErrors:function(){this.addWrapper(this.toHide).hide()},valid:function(){return 0===this.size()},size:function(){return this.errorList.length},focusInvalid:function(){if(this.settings.focusInvalid)try{t(this.findLastActive()||this.errorList.length&&this.errorList[0].element||[]).filter(":visible").focus().trigger("focusin")}catch(e){}},findLastActive:function(){var e=this.lastActive;return e&&1===t.grep(this.errorList,function(t){return t.element.name===e.name}).length&&e},elements:function(){var e=this,i={};return t(this.currentForm).find("input, select, textarea").not(":submit, :reset, :image, [disabled]").not(this.settings.ignore).filter(function(){return!this.name&&e.settings.debug&&window.console&&console.error("%o has no name assigned",this),this.name in i||!e.objectLength(t(this).rules())?!1:(i[this.name]=!0,!0)})},clean:function(e){return t(e)[0]},errors:function(){var e=this.settings.errorClass.replace(" ",".");return t(this.settings.errorElement+"."+e,this.errorContext)},reset:function(){this.successList=[],this.errorList=[],this.errorMap={},this.toShow=t([]),this.toHide=t([]),this.currentElements=t([])},prepareForm:function(){this.reset(),this.toHide=this.errors().add(this.containers)},prepareElement:function(t){this.reset(),this.toHide=this.errorsFor(t)},elementValue:function(e){var i=t(e).attr("type"),s=t(e).val();return"radio"===i||"checkbox"===i?t("input[name='"+t(e).attr("name")+"']:checked").val():"string"==typeof s?s.replace(/\r/g,""):s},check:function(e){e=this.validationTargetFor(this.clean(e));var i,s=t(e).rules(),r=!1,n=this.elementValue(e);for(var a in s){var u={method:a,parameters:s[a]};try{if(i=t.validator.methods[a].call(this,n,e,u.parameters),"dependency-mismatch"===i){r=!0;continue}if(r=!1,"pending"===i)return this.toHide=this.toHide.not(this.errorsFor(e)),void 0;if(!i)return this.formatAndAdd(e,u),!1}catch(o){throw this.settings.debug&&window.console&&console.log("Exception occurred when checking element "+e.id+", check the '"+u.method+"' method.",o),o}}return r?void 0:(this.objectLength(s)&&this.successList.push(e),!0)},customDataMessage:function(e,i){return t(e).data("msg-"+i.toLowerCase())||e.attributes&&t(e).attr("data-msg-"+i.toLowerCase())},customMessage:function(t,e){var i=this.settings.messages[t];return i&&(i.constructor===String?i:i[e])},findDefined:function(){for(var t=0;arguments.length>t;t++)if(void 0!==arguments[t])return arguments[t];return void 0},defaultMessage:function(e,i){return this.findDefined(this.customMessage(e.name,i),this.customDataMessage(e,i),!this.settings.ignoreTitle&&e.title||void 0,t.validator.messages[i],"<strong>Warning: No message defined for "+e.name+"</strong>")},formatAndAdd:function(e,i){var s=this.defaultMessage(e,i.method),r=/\$?\{(\d+)\}/g;"function"==typeof s?s=s.call(this,i.parameters,e):r.test(s)&&(s=t.validator.format(s.replace(r,"{$1}"),i.parameters)),this.errorList.push({message:s,element:e}),this.errorMap[e.name]=s,this.submitted[e.name]=s},addWrapper:function(t){return this.settings.wrapper&&(t=t.add(t.parent(this.settings.wrapper))),t},defaultShowErrors:function(){var t,e;for(t=0;this.errorList[t];t++){var i=this.errorList[t];this.settings.highlight&&this.settings.highlight.call(this,i.element,this.settings.errorClass,this.settings.validClass),this.showLabel(i.element,i.message)}if(this.errorList.length&&(this.toShow=this.toShow.add(this.containers)),this.settings.success)for(t=0;this.successList[t];t++)this.showLabel(this.successList[t]);if(this.settings.unhighlight)for(t=0,e=this.validElements();e[t];t++)this.settings.unhighlight.call(this,e[t],this.settings.errorClass,this.settings.validClass);this.toHide=this.toHide.not(this.toShow),this.hideErrors(),this.addWrapper(this.toShow).show()},validElements:function(){return this.currentElements.not(this.invalidElements())},invalidElements:function(){return t(this.errorList).map(function(){return this.element})},showLabel:function(e,i){var s=this.errorsFor(e);s.length?(s.removeClass(this.settings.validClass).addClass(this.settings.errorClass),s.html(i)):(s=t("<"+this.settings.errorElement+">").attr("for",this.idOrName(e)).addClass(this.settings.errorClass).html(i||""),this.settings.wrapper&&(s=s.hide().show().wrap("<"+this.settings.wrapper+"/>").parent()),this.labelContainer.append(s).length||(this.settings.errorPlacement?this.settings.errorPlacement(s,t(e)):s.insertAfter(e))),!i&&this.settings.success&&(s.text(""),"string"==typeof this.settings.success?s.addClass(this.settings.success):this.settings.success(s,e)),this.toShow=this.toShow.add(s)},errorsFor:function(e){var i=this.idOrName(e);return this.errors().filter(function(){return t(this).attr("for")===i})},idOrName:function(t){return this.groups[t.name]||(this.checkable(t)?t.name:t.id||t.name)},validationTargetFor:function(t){return this.checkable(t)&&(t=this.findByName(t.name).not(this.settings.ignore)[0]),t},checkable:function(t){return/radio|checkbox/i.test(t.type)},findByName:function(e){return t(this.currentForm).find("[name='"+e+"']")},getLength:function(e,i){switch(i.nodeName.toLowerCase()){case"select":return t("option:selected",i).length;case"input":if(this.checkable(i))return this.findByName(i.name).filter(":checked").length}return e.length},depend:function(t,e){return this.dependTypes[typeof t]?this.dependTypes[typeof t](t,e):!0},dependTypes:{"boolean":function(t){return t},string:function(e,i){return!!t(e,i.form).length},"function":function(t,e){return t(e)}},optional:function(e){var i=this.elementValue(e);return!t.validator.methods.required.call(this,i,e)&&"dependency-mismatch"},startRequest:function(t){this.pending[t.name]||(this.pendingRequest++,this.pending[t.name]=!0)},stopRequest:function(e,i){this.pendingRequest--,0>this.pendingRequest&&(this.pendingRequest=0),delete this.pending[e.name],i&&0===this.pendingRequest&&this.formSubmitted&&this.form()?(t(this.currentForm).submit(),this.formSubmitted=!1):!i&&0===this.pendingRequest&&this.formSubmitted&&(t(this.currentForm).triggerHandler("invalid-form",[this]),this.formSubmitted=!1)},previousValue:function(e){return t.data(e,"previousValue")||t.data(e,"previousValue",{old:null,valid:!0,message:this.defaultMessage(e,"remote")})}},classRuleSettings:{required:{required:!0},email:{email:!0},url:{url:!0},date:{date:!0},dateISO:{dateISO:!0},number:{number:!0},digits:{digits:!0},creditcard:{creditcard:!0}},addClassRules:function(e,i){e.constructor===String?this.classRuleSettings[e]=i:t.extend(this.classRuleSettings,e)},classRules:function(e){var i={},s=t(e).attr("class");return s&&t.each(s.split(" "),function(){this in t.validator.classRuleSettings&&t.extend(i,t.validator.classRuleSettings[this])}),i},attributeRules:function(e){var i={},s=t(e),r=s[0].getAttribute("type");for(var n in t.validator.methods){var a;"required"===n?(a=s.get(0).getAttribute(n),""===a&&(a=!0),a=!!a):a=s.attr(n),/min|max/.test(n)&&(null===r||/number|range|text/.test(r))&&(a=Number(a)),a?i[n]=a:r===n&&"range"!==r&&(i[n]=!0)}return i.maxlength&&/-1|2147483647|524288/.test(i.maxlength)&&delete i.maxlength,i},dataRules:function(e){var i,s,r={},n=t(e);for(i in t.validator.methods)s=n.data("rule-"+i.toLowerCase()),void 0!==s&&(r[i]=s);return r},staticRules:function(e){var i={},s=t.data(e.form,"validator");return s.settings.rules&&(i=t.validator.normalizeRule(s.settings.rules[e.name])||{}),i},normalizeRules:function(e,i){return t.each(e,function(s,r){if(r===!1)return delete e[s],void 0;if(r.param||r.depends){var n=!0;switch(typeof r.depends){case"string":n=!!t(r.depends,i.form).length;break;case"function":n=r.depends.call(i,i)}n?e[s]=void 0!==r.param?r.param:!0:delete e[s]}}),t.each(e,function(s,r){e[s]=t.isFunction(r)?r(i):r}),t.each(["minlength","maxlength"],function(){e[this]&&(e[this]=Number(e[this]))}),t.each(["rangelength","range"],function(){var i;e[this]&&(t.isArray(e[this])?e[this]=[Number(e[this][0]),Number(e[this][1])]:"string"==typeof e[this]&&(i=e[this].split(/[\s,]+/),e[this]=[Number(i[0]),Number(i[1])]))}),t.validator.autoCreateRanges&&(e.min&&e.max&&(e.range=[e.min,e.max],delete e.min,delete e.max),e.minlength&&e.maxlength&&(e.rangelength=[e.minlength,e.maxlength],delete e.minlength,delete e.maxlength)),e},normalizeRule:function(e){if("string"==typeof e){var i={};t.each(e.split(/\s/),function(){i[this]=!0}),e=i}return e},addMethod:function(e,i,s){t.validator.methods[e]=i,t.validator.messages[e]=void 0!==s?s:t.validator.messages[e],3>i.length&&t.validator.addClassRules(e,t.validator.normalizeRule(e))},methods:{required:function(e,i,s){if(!this.depend(s,i))return"dependency-mismatch";if("select"===i.nodeName.toLowerCase()){var r=t(i).val();return r&&r.length>0}return this.checkable(i)?this.getLength(e,i)>0:t.trim(e).length>0},email:function(t,e){return this.optional(e)||/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(t)},url:function(t,e){return this.optional(e)||/^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(t)},date:function(t,e){return this.optional(e)||!/Invalid|NaN/.test(""+new Date(t))},dateISO:function(t,e){return this.optional(e)||/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(t)},number:function(t,e){return this.optional(e)||/^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(t)},digits:function(t,e){return this.optional(e)||/^\d+$/.test(t)},creditcard:function(t,e){if(this.optional(e))return"dependency-mismatch";if(/[^0-9 \-]+/.test(t))return!1;var i=0,s=0,r=!1;t=t.replace(/\D/g,"");for(var n=t.length-1;n>=0;n--){var a=t.charAt(n);s=parseInt(a,10),r&&(s*=2)>9&&(s-=9),i+=s,r=!r}return 0===i%10},minlength:function(e,i,s){var r=t.isArray(e)?e.length:this.getLength(t.trim(e),i);return this.optional(i)||r>=s},maxlength:function(e,i,s){var r=t.isArray(e)?e.length:this.getLength(t.trim(e),i);return this.optional(i)||s>=r},rangelength:function(e,i,s){var r=t.isArray(e)?e.length:this.getLength(t.trim(e),i);return this.optional(i)||r>=s[0]&&s[1]>=r},min:function(t,e,i){return this.optional(e)||t>=i},max:function(t,e,i){return this.optional(e)||i>=t},range:function(t,e,i){return this.optional(e)||t>=i[0]&&i[1]>=t},equalTo:function(e,i,s){var r=t(s);return this.settings.onfocusout&&r.unbind(".validate-equalTo").bind("blur.validate-equalTo",function(){t(i).valid()}),e===r.val()},remote:function(e,i,s){if(this.optional(i))return"dependency-mismatch";var r=this.previousValue(i);if(this.settings.messages[i.name]||(this.settings.messages[i.name]={}),r.originalMessage=this.settings.messages[i.name].remote,this.settings.messages[i.name].remote=r.message,s="string"==typeof s&&{url:s}||s,r.old===e)return r.valid;r.old=e;var n=this;this.startRequest(i);var a={};return a[i.name]=e,t.ajax(t.extend(!0,{url:s,mode:"abort",port:"validate"+i.name,dataType:"json",data:a,success:function(s){n.settings.messages[i.name].remote=r.originalMessage;var a=s===!0||"true"===s;if(a){var u=n.formSubmitted;n.prepareElement(i),n.formSubmitted=u,n.successList.push(i),delete n.invalid[i.name],n.showErrors()}else{var o={},l=s||n.defaultMessage(i,"remote");o[i.name]=r.message=t.isFunction(l)?l(e):l,n.invalid[i.name]=!0,n.showErrors(o)}r.valid=a,n.stopRequest(i,a)}},s)),"pending"}}}),t.format=t.validator.format})(jQuery),function(t){var e={};if(t.ajaxPrefilter)t.ajaxPrefilter(function(t,i,s){var r=t.port;"abort"===t.mode&&(e[r]&&e[r].abort(),e[r]=s)});else{var i=t.ajax;t.ajax=function(s){var r=("mode"in s?s:t.ajaxSettings).mode,n=("port"in s?s:t.ajaxSettings).port;return"abort"===r?(e[n]&&e[n].abort(),e[n]=i.apply(this,arguments),e[n]):i.apply(this,arguments)}}}(jQuery),function(t){t.extend(t.fn,{validateDelegate:function(e,i,s){return this.bind(i,function(i){var r=t(i.target);return r.is(e)?s.apply(r,arguments):void 0})}})}(jQuery);
},{}],8:[function(require,module,exports){
/*! svg.js v2.7.1 MIT*/;!function(t,e){"function"==typeof define&&define.amd?define(function(){return e(t,t.document)}):"object"==typeof exports?module.exports=t.document?e(t,t.document):function(t){return e(t,t.document)}:t.SVG=e(t,t.document)}("undefined"!=typeof window?window:this,function(t,e){function i(t,e,i,n){return i+n.replace(b.regex.dots," .")}function n(t){for(var e=t.slice(0),i=e.length;i--;)Array.isArray(e[i])&&(e[i]=n(e[i]));return e}function r(t,e){return t instanceof e}function s(t,e){return(t.matches||t.matchesSelector||t.msMatchesSelector||t.mozMatchesSelector||t.webkitMatchesSelector||t.oMatchesSelector).call(t,e)}function o(t){return t.toLowerCase().replace(/-(.)/g,function(t,e){return e.toUpperCase()})}function a(t){return t.charAt(0).toUpperCase()+t.slice(1)}function h(t){return 4==t.length?["#",t.substring(1,2),t.substring(1,2),t.substring(2,3),t.substring(2,3),t.substring(3,4),t.substring(3,4)].join(""):t}function u(t){var e=t.toString(16);return 1==e.length?"0"+e:e}function l(t,e,i){if(null==e||null==i){var n=t.bbox();null==e?e=n.width/n.height*i:null==i&&(i=n.height/n.width*e)}return{width:e,height:i}}function c(t,e,i){return{x:e*t.a+i*t.c+0,y:e*t.b+i*t.d+0}}function f(t){return{a:t[0],b:t[1],c:t[2],d:t[3],e:t[4],f:t[5]}}function d(t){return t instanceof b.Matrix||(t=new b.Matrix(t)),t}function p(t,e){t.cx=null==t.cx?e.bbox().cx:t.cx,t.cy=null==t.cy?e.bbox().cy:t.cy}function m(t){for(var e=0,i=t.length,n="";e<i;e++)n+=t[e][0],null!=t[e][1]&&(n+=t[e][1],null!=t[e][2]&&(n+=" ",n+=t[e][2],null!=t[e][3]&&(n+=" ",n+=t[e][3],n+=" ",n+=t[e][4],null!=t[e][5]&&(n+=" ",n+=t[e][5],n+=" ",n+=t[e][6],null!=t[e][7]&&(n+=" ",n+=t[e][7])))));return n+" "}function x(e){for(var i=e.childNodes.length-1;i>=0;i--)e.childNodes[i]instanceof t.SVGElement&&x(e.childNodes[i]);return b.adopt(e).id(b.eid(e.nodeName))}function y(t){return null==t.x&&(t.x=0,t.y=0,t.width=0,t.height=0),t.w=t.width,t.h=t.height,t.x2=t.x+t.width,t.y2=t.y+t.height,t.cx=t.x+t.width/2,t.cy=t.y+t.height/2,t}function v(t){var e=(t||"").toString().match(b.regex.reference);if(e)return e[1]}function g(t){return Math.abs(t)>1e-37?t:0}var w=void 0!==this?this:t,b=w.SVG=function(t){if(b.supported)return t=new b.Doc(t),b.parser.draw||b.prepare(),t};if(b.ns="http://www.w3.org/2000/svg",b.xmlns="http://www.w3.org/2000/xmlns/",b.xlink="http://www.w3.org/1999/xlink",b.svgjs="http://svgjs.com/svgjs",b.supported=function(){return!!e.createElementNS&&!!e.createElementNS(b.ns,"svg").createSVGRect}(),!b.supported)return!1;b.did=1e3,b.eid=function(t){return"Svgjs"+a(t)+b.did++},b.create=function(t){var i=e.createElementNS(this.ns,t);return i.setAttribute("id",this.eid(t)),i},b.extend=function(){var t,e,i,n;for(t=[].slice.call(arguments),e=t.pop(),n=t.length-1;n>=0;n--)if(t[n])for(i in e)t[n].prototype[i]=e[i];b.Set&&b.Set.inherit&&b.Set.inherit()},b.invent=function(t){var e="function"==typeof t.create?t.create:function(){this.constructor.call(this,b.create(t.create))};return t.inherit&&(e.prototype=new t.inherit),t.extend&&b.extend(e,t.extend),t.construct&&b.extend(t.parent||b.Container,t.construct),e},b.adopt=function(e){if(!e)return null;if(e.instance)return e.instance;var i;return i="svg"==e.nodeName?e.parentNode instanceof t.SVGElement?new b.Nested:new b.Doc:"linearGradient"==e.nodeName?new b.Gradient("linear"):"radialGradient"==e.nodeName?new b.Gradient("radial"):b[a(e.nodeName)]?new(b[a(e.nodeName)]):new b.Element(e),i.type=e.nodeName,i.node=e,e.instance=i,i instanceof b.Doc&&i.namespace().defs(),i.setData(JSON.parse(e.getAttribute("svgjs:data"))||{}),i},b.prepare=function(){var t=e.getElementsByTagName("body")[0],i=(t?new b.Doc(t):b.adopt(e.documentElement).nested()).size(2,0);b.parser={body:t||e.documentElement,draw:i.style("opacity:0;position:absolute;left:-100%;top:-100%;overflow:hidden").attr("focusable","false").node,poly:i.polyline().node,path:i.path().node,native:b.create("svg")}},b.parser={native:b.create("svg")},e.addEventListener("DOMContentLoaded",function(){b.parser.draw||b.prepare()},!1),b.regex={numberAndUnit:/^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i,hex:/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,rgb:/rgb\((\d+),(\d+),(\d+)\)/,reference:/#([a-z0-9\-_]+)/i,transforms:/\)\s*,?\s*/,whitespace:/\s/g,isHex:/^#[a-f0-9]{3,6}$/i,isRgb:/^rgb\(/,isCss:/[^:]+:[^;]+;?/,isBlank:/^(\s+)?$/,isNumber:/^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,isPercent:/^-?[\d\.]+%$/,isImage:/\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i,delimiter:/[\s,]+/,hyphen:/([^e])\-/gi,pathLetters:/[MLHVCSQTAZ]/gi,isPathLetter:/[MLHVCSQTAZ]/i,numbersWithDots:/((\d?\.\d+(?:e[+-]?\d+)?)((?:\.\d+(?:e[+-]?\d+)?)+))+/gi,dots:/\./g},b.utils={map:function(t,e){var i,n=t.length,r=[];for(i=0;i<n;i++)r.push(e(t[i]));return r},filter:function(t,e){var i,n=t.length,r=[];for(i=0;i<n;i++)e(t[i])&&r.push(t[i]);return r},radians:function(t){return t%360*Math.PI/180},degrees:function(t){return 180*t/Math.PI%360},filterSVGElements:function(e){return this.filter(e,function(e){return e instanceof t.SVGElement})}},b.defaults={attrs:{"fill-opacity":1,"stroke-opacity":1,"stroke-width":0,"stroke-linejoin":"miter","stroke-linecap":"butt",fill:"#000000",stroke:"#000000",opacity:1,x:0,y:0,cx:0,cy:0,width:0,height:0,r:0,rx:0,ry:0,offset:0,"stop-opacity":1,"stop-color":"#000000","font-size":16,"font-family":"Helvetica, Arial, sans-serif","text-anchor":"start"}},b.Color=function(t){var e;this.r=0,this.g=0,this.b=0,t&&("string"==typeof t?b.regex.isRgb.test(t)?(e=b.regex.rgb.exec(t.replace(b.regex.whitespace,"")),this.r=parseInt(e[1]),this.g=parseInt(e[2]),this.b=parseInt(e[3])):b.regex.isHex.test(t)&&(e=b.regex.hex.exec(h(t)),this.r=parseInt(e[1],16),this.g=parseInt(e[2],16),this.b=parseInt(e[3],16)):"object"==typeof t&&(this.r=t.r,this.g=t.g,this.b=t.b))},b.extend(b.Color,{toString:function(){return this.toHex()},toHex:function(){return"#"+u(this.r)+u(this.g)+u(this.b)},toRgb:function(){return"rgb("+[this.r,this.g,this.b].join()+")"},brightness:function(){return this.r/255*.3+this.g/255*.59+this.b/255*.11},morph:function(t){return this.destination=new b.Color(t),this},at:function(t){return this.destination?(t=t<0?0:t>1?1:t,new b.Color({r:~~(this.r+(this.destination.r-this.r)*t),g:~~(this.g+(this.destination.g-this.g)*t),b:~~(this.b+(this.destination.b-this.b)*t)})):this}}),b.Color.test=function(t){return t+="",b.regex.isHex.test(t)||b.regex.isRgb.test(t)},b.Color.isRgb=function(t){return t&&"number"==typeof t.r&&"number"==typeof t.g&&"number"==typeof t.b},b.Color.isColor=function(t){return b.Color.isRgb(t)||b.Color.test(t)},b.Array=function(t,e){t=(t||[]).valueOf(),0==t.length&&e&&(t=e.valueOf()),this.value=this.parse(t)},b.extend(b.Array,{morph:function(t){if(this.destination=this.parse(t),this.value.length!=this.destination.length){for(var e=this.value[this.value.length-1],i=this.destination[this.destination.length-1];this.value.length>this.destination.length;)this.destination.push(i);for(;this.value.length<this.destination.length;)this.value.push(e)}return this},settle:function(){for(var t=0,e=this.value.length,i=[];t<e;t++)-1==i.indexOf(this.value[t])&&i.push(this.value[t]);return this.value=i},at:function(t){if(!this.destination)return this;for(var e=0,i=this.value.length,n=[];e<i;e++)n.push(this.value[e]+(this.destination[e]-this.value[e])*t);return new b.Array(n)},toString:function(){return this.value.join(" ")},valueOf:function(){return this.value},parse:function(t){return t=t.valueOf(),Array.isArray(t)?t:this.split(t)},split:function(t){return t.trim().split(b.regex.delimiter).map(parseFloat)},reverse:function(){return this.value.reverse(),this},clone:function(){var t=new this.constructor;return t.value=n(this.value),t}}),b.PointArray=function(t,e){b.Array.call(this,t,e||[[0,0]])},b.PointArray.prototype=new b.Array,b.PointArray.prototype.constructor=b.PointArray,b.extend(b.PointArray,{toString:function(){for(var t=0,e=this.value.length,i=[];t<e;t++)i.push(this.value[t].join(","));return i.join(" ")},toLine:function(){return{x1:this.value[0][0],y1:this.value[0][1],x2:this.value[1][0],y2:this.value[1][1]}},at:function(t){if(!this.destination)return this;for(var e=0,i=this.value.length,n=[];e<i;e++)n.push([this.value[e][0]+(this.destination[e][0]-this.value[e][0])*t,this.value[e][1]+(this.destination[e][1]-this.value[e][1])*t]);return new b.PointArray(n)},parse:function(t){var e=[];if(t=t.valueOf(),Array.isArray(t)){if(Array.isArray(t[0]))return t.map(function(t){return t.slice()});if(null!=t[0].x)return t.map(function(t){return[t.x,t.y]})}else t=t.trim().split(b.regex.delimiter).map(parseFloat);t.length%2!=0&&t.pop();for(var i=0,n=t.length;i<n;i+=2)e.push([t[i],t[i+1]]);return e},move:function(t,e){var i=this.bbox();if(t-=i.x,e-=i.y,!isNaN(t)&&!isNaN(e))for(var n=this.value.length-1;n>=0;n--)this.value[n]=[this.value[n][0]+t,this.value[n][1]+e];return this},size:function(t,e){var i,n=this.bbox();for(i=this.value.length-1;i>=0;i--)n.width&&(this.value[i][0]=(this.value[i][0]-n.x)*t/n.width+n.x),n.height&&(this.value[i][1]=(this.value[i][1]-n.y)*e/n.height+n.y);return this},bbox:function(){return b.parser.poly.setAttribute("points",this.toString()),b.parser.poly.getBBox()}});for(var C={M:function(t,e,i){return e.x=i.x=t[0],e.y=i.y=t[1],["M",e.x,e.y]},L:function(t,e){return e.x=t[0],e.y=t[1],["L",t[0],t[1]]},H:function(t,e){return e.x=t[0],["H",t[0]]},V:function(t,e){return e.y=t[0],["V",t[0]]},C:function(t,e){return e.x=t[4],e.y=t[5],["C",t[0],t[1],t[2],t[3],t[4],t[5]]},S:function(t,e){return e.x=t[2],e.y=t[3],["S",t[0],t[1],t[2],t[3]]},Q:function(t,e){return e.x=t[2],e.y=t[3],["Q",t[0],t[1],t[2],t[3]]},T:function(t,e){return e.x=t[0],e.y=t[1],["T",t[0],t[1]]},Z:function(t,e,i){return e.x=i.x,e.y=i.y,["Z"]},A:function(t,e){return e.x=t[5],e.y=t[6],["A",t[0],t[1],t[2],t[3],t[4],t[5],t[6]]}},N="mlhvqtcsaz".split(""),A=0,P=N.length;A<P;++A)C[N[A]]=function(t){return function(e,i,n){if("H"==t)e[0]=e[0]+i.x;else if("V"==t)e[0]=e[0]+i.y;else if("A"==t)e[5]=e[5]+i.x,e[6]=e[6]+i.y;else for(var r=0,s=e.length;r<s;++r)e[r]=e[r]+(r%2?i.y:i.x);return C[t](e,i,n)}}(N[A].toUpperCase());b.PathArray=function(t,e){b.Array.call(this,t,e||[["M",0,0]])},b.PathArray.prototype=new b.Array,b.PathArray.prototype.constructor=b.PathArray,b.extend(b.PathArray,{toString:function(){return m(this.value)},move:function(t,e){var i=this.bbox();if(t-=i.x,e-=i.y,!isNaN(t)&&!isNaN(e))for(var n,r=this.value.length-1;r>=0;r--)n=this.value[r][0],"M"==n||"L"==n||"T"==n?(this.value[r][1]+=t,this.value[r][2]+=e):"H"==n?this.value[r][1]+=t:"V"==n?this.value[r][1]+=e:"C"==n||"S"==n||"Q"==n?(this.value[r][1]+=t,this.value[r][2]+=e,this.value[r][3]+=t,this.value[r][4]+=e,"C"==n&&(this.value[r][5]+=t,this.value[r][6]+=e)):"A"==n&&(this.value[r][6]+=t,this.value[r][7]+=e);return this},size:function(t,e){var i,n,r=this.bbox();for(i=this.value.length-1;i>=0;i--)n=this.value[i][0],"M"==n||"L"==n||"T"==n?(this.value[i][1]=(this.value[i][1]-r.x)*t/r.width+r.x,this.value[i][2]=(this.value[i][2]-r.y)*e/r.height+r.y):"H"==n?this.value[i][1]=(this.value[i][1]-r.x)*t/r.width+r.x:"V"==n?this.value[i][1]=(this.value[i][1]-r.y)*e/r.height+r.y:"C"==n||"S"==n||"Q"==n?(this.value[i][1]=(this.value[i][1]-r.x)*t/r.width+r.x,this.value[i][2]=(this.value[i][2]-r.y)*e/r.height+r.y,this.value[i][3]=(this.value[i][3]-r.x)*t/r.width+r.x,this.value[i][4]=(this.value[i][4]-r.y)*e/r.height+r.y,"C"==n&&(this.value[i][5]=(this.value[i][5]-r.x)*t/r.width+r.x,this.value[i][6]=(this.value[i][6]-r.y)*e/r.height+r.y)):"A"==n&&(this.value[i][1]=this.value[i][1]*t/r.width,this.value[i][2]=this.value[i][2]*e/r.height,this.value[i][6]=(this.value[i][6]-r.x)*t/r.width+r.x,this.value[i][7]=(this.value[i][7]-r.y)*e/r.height+r.y);return this},equalCommands:function(t){var e,i,n;for(t=new b.PathArray(t),n=this.value.length===t.value.length,e=0,i=this.value.length;n&&e<i;e++)n=this.value[e][0]===t.value[e][0];return n},morph:function(t){return t=new b.PathArray(t),this.equalCommands(t)?this.destination=t:this.destination=null,this},at:function(t){if(!this.destination)return this;var e,i,n,r,s=this.value,o=this.destination.value,a=[],h=new b.PathArray;for(e=0,i=s.length;e<i;e++){for(a[e]=[s[e][0]],n=1,r=s[e].length;n<r;n++)a[e][n]=s[e][n]+(o[e][n]-s[e][n])*t;"A"===a[e][0]&&(a[e][4]=+(0!=a[e][4]),a[e][5]=+(0!=a[e][5]))}return h.value=a,h},parse:function(t){if(t instanceof b.PathArray)return t.valueOf();var e,n,r={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};t="string"==typeof t?t.replace(b.regex.numbersWithDots,i).replace(b.regex.pathLetters," $& ").replace(b.regex.hyphen,"$1 -").trim().split(b.regex.delimiter):t.reduce(function(t,e){return[].concat.call(t,e)},[]);var n=[],s=new b.Point,o=new b.Point,a=0,h=t.length;do{b.regex.isPathLetter.test(t[a])?(e=t[a],++a):"M"==e?e="L":"m"==e&&(e="l"),n.push(C[e].call(null,t.slice(a,a+=r[e.toUpperCase()]).map(parseFloat),s,o))}while(h>a);return n},bbox:function(){return b.parser.path.setAttribute("d",this.toString()),b.parser.path.getBBox()}}),b.Number=b.invent({create:function(t,e){this.value=0,this.unit=e||"","number"==typeof t?this.value=isNaN(t)?0:isFinite(t)?t:t<0?-3.4e38:3.4e38:"string"==typeof t?(e=t.match(b.regex.numberAndUnit))&&(this.value=parseFloat(e[1]),"%"==e[5]?this.value/=100:"s"==e[5]&&(this.value*=1e3),this.unit=e[5]):t instanceof b.Number&&(this.value=t.valueOf(),this.unit=t.unit)},extend:{toString:function(){return("%"==this.unit?~~(1e8*this.value)/1e6:"s"==this.unit?this.value/1e3:this.value)+this.unit},toJSON:function(){return this.toString()},valueOf:function(){return this.value},plus:function(t){return t=new b.Number(t),new b.Number(this+t,this.unit||t.unit)},minus:function(t){return t=new b.Number(t),new b.Number(this-t,this.unit||t.unit)},times:function(t){return t=new b.Number(t),new b.Number(this*t,this.unit||t.unit)},divide:function(t){return t=new b.Number(t),new b.Number(this/t,this.unit||t.unit)},to:function(t){var e=new b.Number(this);return"string"==typeof t&&(e.unit=t),e},morph:function(t){return this.destination=new b.Number(t),t.relative&&(this.destination.value+=this.value),this},at:function(t){return this.destination?new b.Number(this.destination).minus(this).times(t).plus(this):this}}}),b.Element=b.invent({create:function(t){this._stroke=b.defaults.attrs.stroke,this._event=null,this._events={},this.dom={},(this.node=t)&&(this.type=t.nodeName,this.node.instance=this,this._events=t._events||{},this._stroke=t.getAttribute("stroke")||this._stroke)},extend:{x:function(t){return this.attr("x",t)},y:function(t){return this.attr("y",t)},cx:function(t){return null==t?this.x()+this.width()/2:this.x(t-this.width()/2)},cy:function(t){return null==t?this.y()+this.height()/2:this.y(t-this.height()/2)},move:function(t,e){return this.x(t).y(e)},center:function(t,e){return this.cx(t).cy(e)},width:function(t){return this.attr("width",t)},height:function(t){return this.attr("height",t)},size:function(t,e){var i=l(this,t,e);return this.width(new b.Number(i.width)).height(new b.Number(i.height))},clone:function(t){this.writeDataToDom();var e=x(this.node.cloneNode(!0));return t?t.add(e):this.after(e),e},remove:function(){return this.parent()&&this.parent().removeElement(this),this},replace:function(t){return this.after(t).remove(),t},addTo:function(t){return t.put(this)},putIn:function(t){return t.add(this)},id:function(t){return this.attr("id",t)},inside:function(t,e){var i=this.bbox();return t>i.x&&e>i.y&&t<i.x+i.width&&e<i.y+i.height},show:function(){return this.style("display","")},hide:function(){return this.style("display","none")},visible:function(){return"none"!=this.style("display")},toString:function(){return this.attr("id")},classes:function(){var t=this.attr("class");return null==t?[]:t.trim().split(b.regex.delimiter)},hasClass:function(t){return-1!=this.classes().indexOf(t)},addClass:function(t){if(!this.hasClass(t)){var e=this.classes();e.push(t),this.attr("class",e.join(" "))}return this},removeClass:function(t){return this.hasClass(t)&&this.attr("class",this.classes().filter(function(e){return e!=t}).join(" ")),this},toggleClass:function(t){return this.hasClass(t)?this.removeClass(t):this.addClass(t)},reference:function(t){return b.get(this.attr(t))},parent:function(e){var i=this;if(!i.node.parentNode)return null;if(i=b.adopt(i.node.parentNode),!e)return i;for(;i&&i.node instanceof t.SVGElement;){if("string"==typeof e?i.matches(e):i instanceof e)return i;if(!i.node.parentNode||"#document"==i.node.parentNode.nodeName||"#document-fragment"==i.node.parentNode.nodeName)return null;i=b.adopt(i.node.parentNode)}},doc:function(){return this instanceof b.Doc?this:this.parent(b.Doc)},parents:function(t){var e=[],i=this;do{if(!(i=i.parent(t))||!i.node)break;e.push(i)}while(i.parent);return e},matches:function(t){return s(this.node,t)},native:function(){return this.node},svg:function(t){var i=e.createElement("svg");if(!(t&&this instanceof b.Parent))return i.appendChild(t=e.createElement("svg")),this.writeDataToDom(),t.appendChild(this.node.cloneNode(!0)),i.innerHTML.replace(/^<svg>/,"").replace(/<\/svg>$/,"");i.innerHTML="<svg>"+t.replace(/\n/,"").replace(/<([\w:-]+)([^<]+?)\/>/g,"<$1$2></$1>")+"</svg>";for(var n=0,r=i.firstChild.childNodes.length;n<r;n++)this.node.appendChild(i.firstChild.firstChild);return this},writeDataToDom:function(){if(this.each||this.lines){(this.each?this:this.lines()).each(function(){this.writeDataToDom()})}return this.node.removeAttribute("svgjs:data"),Object.keys(this.dom).length&&this.node.setAttribute("svgjs:data",JSON.stringify(this.dom)),this},setData:function(t){return this.dom=t,this},is:function(t){return r(this,t)}}}),b.easing={"-":function(t){return t},"<>":function(t){return-Math.cos(t*Math.PI)/2+.5},">":function(t){return Math.sin(t*Math.PI/2)},"<":function(t){return 1-Math.cos(t*Math.PI/2)}},b.morph=function(t){return function(e,i){return new b.MorphObj(e,i).at(t)}},b.Situation=b.invent({create:function(t){this.init=!1,this.reversed=!1,this.reversing=!1,this.duration=new b.Number(t.duration).valueOf(),this.delay=new b.Number(t.delay).valueOf(),this.start=+new Date+this.delay,this.finish=this.start+this.duration,this.ease=t.ease,this.loop=0,this.loops=!1,this.animations={},this.attrs={},this.styles={},this.transforms=[],this.once={}}}),b.FX=b.invent({create:function(t){this._target=t,this.situations=[],this.active=!1,this.situation=null,this.paused=!1,this.lastPos=0,this.pos=0,this.absPos=0,this._speed=1},extend:{animate:function(t,e,i){"object"==typeof t&&(e=t.ease,i=t.delay,t=t.duration);var n=new b.Situation({duration:t||1e3,delay:i||0,ease:b.easing[e||"-"]||e});return this.queue(n),this},delay:function(t){var e=new b.Situation({duration:t,delay:0,ease:b.easing["-"]});return this.queue(e)},target:function(t){return t&&t instanceof b.Element?(this._target=t,this):this._target},timeToAbsPos:function(t){return(t-this.situation.start)/(this.situation.duration/this._speed)},absPosToTime:function(t){return this.situation.duration/this._speed*t+this.situation.start},startAnimFrame:function(){this.stopAnimFrame(),this.animationFrame=t.requestAnimationFrame(function(){this.step()}.bind(this))},stopAnimFrame:function(){t.cancelAnimationFrame(this.animationFrame)},start:function(){return!this.active&&this.situation&&(this.active=!0,this.startCurrent()),this},startCurrent:function(){return this.situation.start=+new Date+this.situation.delay/this._speed,this.situation.finish=this.situation.start+this.situation.duration/this._speed,this.initAnimations().step()},queue:function(t){return("function"==typeof t||t instanceof b.Situation)&&this.situations.push(t),this.situation||(this.situation=this.situations.shift()),this},dequeue:function(){return this.stop(),this.situation=this.situations.shift(),this.situation&&(this.situation instanceof b.Situation?this.start():this.situation.call(this)),this},initAnimations:function(){var t,e,i,n=this.situation;if(n.init)return this;for(t in n.animations)for(i=this.target()[t](),Array.isArray(i)||(i=[i]),Array.isArray(n.animations[t])||(n.animations[t]=[n.animations[t]]),e=i.length;e--;)n.animations[t][e]instanceof b.Number&&(i[e]=new b.Number(i[e])),n.animations[t][e]=i[e].morph(n.animations[t][e]);for(t in n.attrs)n.attrs[t]=new b.MorphObj(this.target().attr(t),n.attrs[t]);for(t in n.styles)n.styles[t]=new b.MorphObj(this.target().style(t),n.styles[t]);return n.initialTransformation=this.target().matrixify(),n.init=!0,this},clearQueue:function(){return this.situations=[],this},clearCurrent:function(){return this.situation=null,this},stop:function(t,e){var i=this.active;return this.active=!1,e&&this.clearQueue(),t&&this.situation&&(!i&&this.startCurrent(),this.atEnd()),this.stopAnimFrame(),this.clearCurrent()},reset:function(){if(this.situation){var t=this.situation;this.stop(),this.situation=t,this.atStart()}return this},finish:function(){for(this.stop(!0,!1);this.dequeue().situation&&this.stop(!0,!1););return this.clearQueue().clearCurrent(),this},atStart:function(){return this.at(0,!0)},atEnd:function(){return!0===this.situation.loops&&(this.situation.loops=this.situation.loop+1),"number"==typeof this.situation.loops?this.at(this.situation.loops,!0):this.at(1,!0)},at:function(t,e){var i=this.situation.duration/this._speed;return this.absPos=t,e||(this.situation.reversed&&(this.absPos=1-this.absPos),this.absPos+=this.situation.loop),this.situation.start=+new Date-this.absPos*i,this.situation.finish=this.situation.start+i,this.step(!0)},speed:function(t){return 0===t?this.pause():t?(this._speed=t,this.at(this.absPos,!0)):this._speed},loop:function(t,e){var i=this.last();return i.loops=null==t||t,i.loop=0,e&&(i.reversing=!0),this},pause:function(){return this.paused=!0,this.stopAnimFrame(),this},play:function(){return this.paused?(this.paused=!1,this.at(this.absPos,!0)):this},reverse:function(t){var e=this.last();return e.reversed=void 0===t?!e.reversed:t,this},progress:function(t){return t?this.situation.ease(this.pos):this.pos},after:function(t){var e=this.last(),i=function i(n){n.detail.situation==e&&(t.call(this,e),this.off("finished.fx",i))};return this.target().on("finished.fx",i),this._callStart()},during:function(t){var e=this.last(),i=function(i){i.detail.situation==e&&t.call(this,i.detail.pos,b.morph(i.detail.pos),i.detail.eased,e)};return this.target().off("during.fx",i).on("during.fx",i),this.after(function(){this.off("during.fx",i)}),this._callStart()},afterAll:function(t){var e=function e(i){t.call(this),this.off("allfinished.fx",e)};return this.target().off("allfinished.fx",e).on("allfinished.fx",e),this._callStart()},duringAll:function(t){var e=function(e){t.call(this,e.detail.pos,b.morph(e.detail.pos),e.detail.eased,e.detail.situation)};return this.target().off("during.fx",e).on("during.fx",e),this.afterAll(function(){this.off("during.fx",e)}),this._callStart()},last:function(){return this.situations.length?this.situations[this.situations.length-1]:this.situation},add:function(t,e,i){return this.last()[i||"animations"][t]=e,this._callStart()},step:function(t){if(t||(this.absPos=this.timeToAbsPos(+new Date)),!1!==this.situation.loops){var e,i,n;e=Math.max(this.absPos,0),i=Math.floor(e),!0===this.situation.loops||i<this.situation.loops?(this.pos=e-i,n=this.situation.loop,this.situation.loop=i):(this.absPos=this.situation.loops,this.pos=1,n=this.situation.loop-1,this.situation.loop=this.situation.loops),this.situation.reversing&&(this.situation.reversed=this.situation.reversed!=Boolean((this.situation.loop-n)%2))}else this.absPos=Math.min(this.absPos,1),this.pos=this.absPos;this.pos<0&&(this.pos=0),this.situation.reversed&&(this.pos=1-this.pos);var r=this.situation.ease(this.pos);for(var s in this.situation.once)s>this.lastPos&&s<=r&&(this.situation.once[s].call(this.target(),this.pos,r),delete this.situation.once[s]);return this.active&&this.target().fire("during",{pos:this.pos,eased:r,fx:this,situation:this.situation}),this.situation?(this.eachAt(),1==this.pos&&!this.situation.reversed||this.situation.reversed&&0==this.pos?(this.stopAnimFrame(),this.target().fire("finished",{fx:this,situation:this.situation}),this.situations.length||(this.target().fire("allfinished"),this.situations.length||(this.target().off(".fx"),this.active=!1)),this.active?this.dequeue():this.clearCurrent()):!this.paused&&this.active&&this.startAnimFrame(),this.lastPos=r,this):this},eachAt:function(){var t,e,i,n=this,r=this.target(),s=this.situation;for(t in s.animations)i=[].concat(s.animations[t]).map(function(t){return"string"!=typeof t&&t.at?t.at(s.ease(n.pos),n.pos):t}),r[t].apply(r,i);for(t in s.attrs)i=[t].concat(s.attrs[t]).map(function(t){return"string"!=typeof t&&t.at?t.at(s.ease(n.pos),n.pos):t}),r.attr.apply(r,i);for(t in s.styles)i=[t].concat(s.styles[t]).map(function(t){return"string"!=typeof t&&t.at?t.at(s.ease(n.pos),n.pos):t}),r.style.apply(r,i);if(s.transforms.length){for(i=s.initialTransformation,t=0,e=s.transforms.length;t<e;t++){var o=s.transforms[t];o instanceof b.Matrix?i=o.relative?i.multiply((new b.Matrix).morph(o).at(s.ease(this.pos))):i.morph(o).at(s.ease(this.pos)):(o.relative||o.undo(i.extract()),i=i.multiply(o.at(s.ease(this.pos))))}r.matrix(i)}return this},once:function(t,e,i){var n=this.last();return i||(t=n.ease(t)),n.once[t]=e,this},_callStart:function(){return setTimeout(function(){this.start()}.bind(this),0),this}},parent:b.Element,construct:{animate:function(t,e,i){return(this.fx||(this.fx=new b.FX(this))).animate(t,e,i)},delay:function(t){return(this.fx||(this.fx=new b.FX(this))).delay(t)},stop:function(t,e){return this.fx&&this.fx.stop(t,e),this},finish:function(){return this.fx&&this.fx.finish(),this},pause:function(){return this.fx&&this.fx.pause(),this},play:function(){return this.fx&&this.fx.play(),this},speed:function(t){if(this.fx){if(null==t)return this.fx.speed();this.fx.speed(t)}return this}}}),b.MorphObj=b.invent({create:function(t,e){return b.Color.isColor(e)?new b.Color(t).morph(e):b.regex.delimiter.test(t)?b.regex.pathLetters.test(t)?new b.PathArray(t).morph(e):new b.Array(t).morph(e):b.regex.numberAndUnit.test(e)?new b.Number(t).morph(e):(this.value=t,void(this.destination=e))},extend:{at:function(t,e){return e<1?this.value:this.destination},valueOf:function(){return this.value}}}),b.extend(b.FX,{attr:function(t,e,i){if("object"==typeof t)for(var n in t)this.attr(n,t[n]);else this.add(t,e,"attrs");return this},style:function(t,e){if("object"==typeof t)for(var i in t)this.style(i,t[i]);else this.add(t,e,"styles");return this},x:function(t,e){if(this.target()instanceof b.G)return this.transform({x:t},e),this;var i=new b.Number(t);return i.relative=e,this.add("x",i)},y:function(t,e){if(this.target()instanceof b.G)return this.transform({y:t},e),this;var i=new b.Number(t);return i.relative=e,this.add("y",i)},cx:function(t){return this.add("cx",new b.Number(t))},cy:function(t){return this.add("cy",new b.Number(t))},move:function(t,e){return this.x(t).y(e)},center:function(t,e){return this.cx(t).cy(e)},size:function(t,e){if(this.target()instanceof b.Text)this.attr("font-size",t);else{var i;t&&e||(i=this.target().bbox()),t||(t=i.width/i.height*e),e||(e=i.height/i.width*t),this.add("width",new b.Number(t)).add("height",new b.Number(e))}return this},width:function(t){return this.add("width",new b.Number(t))},height:function(t){return this.add("height",new b.Number(t))},plot:function(t,e,i,n){return 4==arguments.length?this.plot([t,e,i,n]):this.add("plot",new(this.target().morphArray)(t))},leading:function(t){return this.target().leading?this.add("leading",new b.Number(t)):this},viewbox:function(t,e,i,n){return this.target()instanceof b.Container&&this.add("viewbox",new b.ViewBox(t,e,i,n)),this},update:function(t){if(this.target()instanceof b.Stop){if("number"==typeof t||t instanceof b.Number)return this.update({offset:arguments[0],color:arguments[1],opacity:arguments[2]});null!=t.opacity&&this.attr("stop-opacity",t.opacity),null!=t.color&&this.attr("stop-color",t.color),null!=t.offset&&this.attr("offset",t.offset)}return this}}),b.Box=b.invent({create:function(t,e,i,n){if(!("object"!=typeof t||t instanceof b.Element))return b.Box.call(this,null!=t.left?t.left:t.x,null!=t.top?t.top:t.y,t.width,t.height);4==arguments.length&&(this.x=t,this.y=e,this.width=i,this.height=n),y(this)},extend:{merge:function(t){var e=new this.constructor;return e.x=Math.min(this.x,t.x),e.y=Math.min(this.y,t.y),e.width=Math.max(this.x+this.width,t.x+t.width)-e.x,e.height=Math.max(this.y+this.height,t.y+t.height)-e.y,y(e)},transform:function(t){var e,i=1/0,n=-1/0,r=1/0,s=-1/0;return[new b.Point(this.x,this.y),new b.Point(this.x2,this.y),new b.Point(this.x,this.y2),new b.Point(this.x2,this.y2)].forEach(function(e){e=e.transform(t),i=Math.min(i,e.x),n=Math.max(n,e.x),r=Math.min(r,e.y),s=Math.max(s,e.y)}),e=new this.constructor,e.x=i,e.width=n-i,e.y=r,e.height=s-r,y(e),e}}}),b.BBox=b.invent({create:function(t){if(b.Box.apply(this,[].slice.call(arguments)),t instanceof b.Element){var i;try{if(e.documentElement.contains){if(!e.documentElement.contains(t.node))throw new Exception("Element not in the dom")}else{for(var n=t.node;n.parentNode;)n=n.parentNode;if(n!=e)throw new Exception("Element not in the dom")}i=t.node.getBBox()}catch(e){if(t instanceof b.Shape){var r=t.clone(b.parser.draw.instance).show();i=r.node.getBBox(),r.remove()}else i={x:t.node.clientLeft,y:t.node.clientTop,width:t.node.clientWidth,height:t.node.clientHeight}}b.Box.call(this,i)}},inherit:b.Box,parent:b.Element,construct:{bbox:function(){return new b.BBox(this)}}}),b.BBox.prototype.constructor=b.BBox,b.extend(b.Element,{tbox:function(){return console.warn("Use of TBox is deprecated and mapped to RBox. Use .rbox() instead."),this.rbox(this.doc())}}),b.RBox=b.invent({create:function(t){b.Box.apply(this,[].slice.call(arguments)),t instanceof b.Element&&b.Box.call(this,t.node.getBoundingClientRect())},inherit:b.Box,parent:b.Element,extend:{addOffset:function(){return this.x+=t.pageXOffset,this.y+=t.pageYOffset,this}},construct:{rbox:function(t){return t?new b.RBox(this).transform(t.screenCTM().inverse()):new b.RBox(this).addOffset()}}}),b.RBox.prototype.constructor=b.RBox,b.Matrix=b.invent({create:function(t){var e,i=f([1,0,0,1,0,0]);for(t=t instanceof b.Element?t.matrixify():"string"==typeof t?f(t.split(b.regex.delimiter).map(parseFloat)):6==arguments.length?f([].slice.call(arguments)):Array.isArray(t)?f(t):"object"==typeof t?t:i,e=k.length-1;e>=0;--e)this[k[e]]=null!=t[k[e]]?t[k[e]]:i[k[e]]},extend:{extract:function(){var t=c(this,0,1),e=c(this,1,0),i=180/Math.PI*Math.atan2(t.y,t.x)-90;return{x:this.e,y:this.f,transformedX:(this.e*Math.cos(i*Math.PI/180)+this.f*Math.sin(i*Math.PI/180))/Math.sqrt(this.a*this.a+this.b*this.b),transformedY:(this.f*Math.cos(i*Math.PI/180)+this.e*Math.sin(-i*Math.PI/180))/Math.sqrt(this.c*this.c+this.d*this.d),skewX:-i,skewY:180/Math.PI*Math.atan2(e.y,e.x),scaleX:Math.sqrt(this.a*this.a+this.b*this.b),scaleY:Math.sqrt(this.c*this.c+this.d*this.d),rotation:i,a:this.a,b:this.b,c:this.c,d:this.d,e:this.e,f:this.f,matrix:new b.Matrix(this)}},clone:function(){return new b.Matrix(this)},morph:function(t){return this.destination=new b.Matrix(t),this},at:function(t){return this.destination?new b.Matrix({a:this.a+(this.destination.a-this.a)*t,b:this.b+(this.destination.b-this.b)*t,c:this.c+(this.destination.c-this.c)*t,d:this.d+(this.destination.d-this.d)*t,e:this.e+(this.destination.e-this.e)*t,f:this.f+(this.destination.f-this.f)*t}):this},multiply:function(t){return new b.Matrix(this.native().multiply(d(t).native()))},inverse:function(){return new b.Matrix(this.native().inverse())},translate:function(t,e){return new b.Matrix(this.native().translate(t||0,e||0))},scale:function(t,e,i,n){return 1==arguments.length?e=t:3==arguments.length&&(n=i,i=e,e=t),this.around(i,n,new b.Matrix(t,0,0,e,0,0))},rotate:function(t,e,i){return t=b.utils.radians(t),this.around(e,i,new b.Matrix(Math.cos(t),Math.sin(t),-Math.sin(t),Math.cos(t),0,0))},flip:function(t,e){return"x"==t?this.scale(-1,1,e,0):"y"==t?this.scale(1,-1,0,e):this.scale(-1,-1,t,null!=e?e:t)},skew:function(t,e,i,n){
            return 1==arguments.length?e=t:3==arguments.length&&(n=i,i=e,e=t),t=b.utils.radians(t),e=b.utils.radians(e),this.around(i,n,new b.Matrix(1,Math.tan(e),Math.tan(t),1,0,0))},skewX:function(t,e,i){return this.skew(t,0,e,i)},skewY:function(t,e,i){return this.skew(0,t,e,i)},around:function(t,e,i){return this.multiply(new b.Matrix(1,0,0,1,t||0,e||0)).multiply(i).multiply(new b.Matrix(1,0,0,1,-t||0,-e||0))},native:function(){for(var t=b.parser.native.createSVGMatrix(),e=k.length-1;e>=0;e--)t[k[e]]=this[k[e]];return t},toString:function(){return"matrix("+g(this.a)+","+g(this.b)+","+g(this.c)+","+g(this.d)+","+g(this.e)+","+g(this.f)+")"}},parent:b.Element,construct:{ctm:function(){return new b.Matrix(this.node.getCTM())},screenCTM:function(){if(this instanceof b.Nested){var t=this.rect(1,1),e=t.node.getScreenCTM();return t.remove(),new b.Matrix(e)}return new b.Matrix(this.node.getScreenCTM())}}}),b.Point=b.invent({create:function(t,e){var i,n={x:0,y:0};i=Array.isArray(t)?{x:t[0],y:t[1]}:"object"==typeof t?{x:t.x,y:t.y}:null!=t?{x:t,y:null!=e?e:t}:n,this.x=i.x,this.y=i.y},extend:{clone:function(){return new b.Point(this)},morph:function(t,e){return this.destination=new b.Point(t,e),this},at:function(t){return this.destination?new b.Point({x:this.x+(this.destination.x-this.x)*t,y:this.y+(this.destination.y-this.y)*t}):this},native:function(){var t=b.parser.native.createSVGPoint();return t.x=this.x,t.y=this.y,t},transform:function(t){return new b.Point(this.native().matrixTransform(t.native()))}}}),b.extend(b.Element,{point:function(t,e){return new b.Point(t,e).transform(this.screenCTM().inverse())}}),b.extend(b.Element,{attr:function(t,e,i){if(null==t){for(t={},e=this.node.attributes,i=e.length-1;i>=0;i--)t[e[i].nodeName]=b.regex.isNumber.test(e[i].nodeValue)?parseFloat(e[i].nodeValue):e[i].nodeValue;return t}if("object"==typeof t)for(e in t)this.attr(e,t[e]);else if(null===e)this.node.removeAttribute(t);else{if(null==e)return e=this.node.getAttribute(t),null==e?b.defaults.attrs[t]:b.regex.isNumber.test(e)?parseFloat(e):e;"stroke-width"==t?this.attr("stroke",parseFloat(e)>0?this._stroke:null):"stroke"==t&&(this._stroke=e),"fill"!=t&&"stroke"!=t||(b.regex.isImage.test(e)&&(e=this.doc().defs().image(e,0,0)),e instanceof b.Image&&(e=this.doc().defs().pattern(0,0,function(){this.add(e)}))),"number"==typeof e?e=new b.Number(e):b.Color.isColor(e)?e=new b.Color(e):Array.isArray(e)&&(e=new b.Array(e)),"leading"==t?this.leading&&this.leading(e):"string"==typeof i?this.node.setAttributeNS(i,t,e.toString()):this.node.setAttribute(t,e.toString()),!this.rebuild||"font-size"!=t&&"x"!=t||this.rebuild(t,e)}return this}}),b.extend(b.Element,{transform:function(t,e){var i,n,r=this;if("object"!=typeof t)return i=new b.Matrix(r).extract(),"string"==typeof t?i[t]:i;if(i=new b.Matrix(r),e=!!e||!!t.relative,null!=t.a)i=e?i.multiply(new b.Matrix(t)):new b.Matrix(t);else if(null!=t.rotation)p(t,r),i=e?i.rotate(t.rotation,t.cx,t.cy):i.rotate(t.rotation-i.extract().rotation,t.cx,t.cy);else if(null!=t.scale||null!=t.scaleX||null!=t.scaleY){if(p(t,r),t.scaleX=null!=t.scale?t.scale:null!=t.scaleX?t.scaleX:1,t.scaleY=null!=t.scale?t.scale:null!=t.scaleY?t.scaleY:1,!e){var s=i.extract();t.scaleX=1*t.scaleX/s.scaleX,t.scaleY=1*t.scaleY/s.scaleY}i=i.scale(t.scaleX,t.scaleY,t.cx,t.cy)}else if(null!=t.skew||null!=t.skewX||null!=t.skewY){if(p(t,r),t.skewX=null!=t.skew?t.skew:null!=t.skewX?t.skewX:0,t.skewY=null!=t.skew?t.skew:null!=t.skewY?t.skewY:0,!e){var s=i.extract();i=i.multiply((new b.Matrix).skew(s.skewX,s.skewY,t.cx,t.cy).inverse())}i=i.skew(t.skewX,t.skewY,t.cx,t.cy)}else t.flip?("x"==t.flip||"y"==t.flip?t.offset=null==t.offset?r.bbox()["c"+t.flip]:t.offset:null==t.offset?(n=r.bbox(),t.flip=n.cx,t.offset=n.cy):t.flip=t.offset,i=(new b.Matrix).flip(t.flip,t.offset)):null==t.x&&null==t.y||(e?i=i.translate(t.x,t.y):(null!=t.x&&(i.e=t.x),null!=t.y&&(i.f=t.y)));return this.attr("transform",i)}}),b.extend(b.FX,{transform:function(t,e){var i,n,r=this.target();return"object"!=typeof t?(i=new b.Matrix(r).extract(),"string"==typeof t?i[t]:i):(e=!!e||!!t.relative,null!=t.a?i=new b.Matrix(t):null!=t.rotation?(p(t,r),i=new b.Rotate(t.rotation,t.cx,t.cy)):null!=t.scale||null!=t.scaleX||null!=t.scaleY?(p(t,r),t.scaleX=null!=t.scale?t.scale:null!=t.scaleX?t.scaleX:1,t.scaleY=null!=t.scale?t.scale:null!=t.scaleY?t.scaleY:1,i=new b.Scale(t.scaleX,t.scaleY,t.cx,t.cy)):null!=t.skewX||null!=t.skewY?(p(t,r),t.skewX=null!=t.skewX?t.skewX:0,t.skewY=null!=t.skewY?t.skewY:0,i=new b.Skew(t.skewX,t.skewY,t.cx,t.cy)):t.flip?("x"==t.flip||"y"==t.flip?t.offset=null==t.offset?r.bbox()["c"+t.flip]:t.offset:null==t.offset?(n=r.bbox(),t.flip=n.cx,t.offset=n.cy):t.flip=t.offset,i=(new b.Matrix).flip(t.flip,t.offset)):null==t.x&&null==t.y||(i=new b.Translate(t.x,t.y)),i?(i.relative=e,this.last().transforms.push(i),this._callStart()):this)}}),b.extend(b.Element,{untransform:function(){return this.attr("transform",null)},matrixify:function(){return(this.attr("transform")||"").split(b.regex.transforms).slice(0,-1).map(function(t){var e=t.trim().split("(");return[e[0],e[1].split(b.regex.delimiter).map(function(t){return parseFloat(t)})]}).reduce(function(t,e){return"matrix"==e[0]?t.multiply(f(e[1])):t[e[0]].apply(t,e[1])},new b.Matrix)},toParent:function(t){if(this==t)return this;var e=this.screenCTM(),i=t.screenCTM().inverse();return this.addTo(t).untransform().transform(i.multiply(e)),this},toDoc:function(){return this.toParent(this.doc())}}),b.Transformation=b.invent({create:function(t,e){if(arguments.length>1&&"boolean"!=typeof e)return this.constructor.call(this,[].slice.call(arguments));if(Array.isArray(t))for(var i=0,n=this.arguments.length;i<n;++i)this[this.arguments[i]]=t[i];else if("object"==typeof t)for(var i=0,n=this.arguments.length;i<n;++i)this[this.arguments[i]]=t[this.arguments[i]];this.inversed=!1,!0===e&&(this.inversed=!0)},extend:{arguments:[],method:"",at:function(t){for(var e=[],i=0,n=this.arguments.length;i<n;++i)e.push(this[this.arguments[i]]);var r=this._undo||new b.Matrix;return r=(new b.Matrix).morph(b.Matrix.prototype[this.method].apply(r,e)).at(t),this.inversed?r.inverse():r},undo:function(t){for(var e=0,i=this.arguments.length;e<i;++e)t[this.arguments[e]]=void 0===this[this.arguments[e]]?0:t[this.arguments[e]];return t.cx=this.cx,t.cy=this.cy,this._undo=new(b[a(this.method)])(t,!0).at(1),this}}}),b.Translate=b.invent({parent:b.Matrix,inherit:b.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["transformedX","transformedY"],method:"translate"}}),b.Rotate=b.invent({parent:b.Matrix,inherit:b.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["rotation","cx","cy"],method:"rotate",at:function(t){var e=(new b.Matrix).rotate((new b.Number).morph(this.rotation-(this._undo?this._undo.rotation:0)).at(t),this.cx,this.cy);return this.inversed?e.inverse():e},undo:function(t){return this._undo=t,this}}}),b.Scale=b.invent({parent:b.Matrix,inherit:b.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["scaleX","scaleY","cx","cy"],method:"scale"}}),b.Skew=b.invent({parent:b.Matrix,inherit:b.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["skewX","skewY","cx","cy"],method:"skew"}}),b.extend(b.Element,{style:function(t,e){if(0==arguments.length)return this.node.style.cssText||"";if(arguments.length<2)if("object"==typeof t)for(e in t)this.style(e,t[e]);else{if(!b.regex.isCss.test(t))return this.node.style[o(t)];for(t=t.split(/\s*;\s*/).filter(function(t){return!!t}).map(function(t){return t.split(/\s*:\s*/)});e=t.pop();)this.style(e[0],e[1])}else this.node.style[o(t)]=null===e||b.regex.isBlank.test(e)?"":e;return this}}),b.Parent=b.invent({create:function(t){this.constructor.call(this,t)},inherit:b.Element,extend:{children:function(){return b.utils.map(b.utils.filterSVGElements(this.node.childNodes),function(t){return b.adopt(t)})},add:function(t,e){return null==e?this.node.appendChild(t.node):t.node!=this.node.childNodes[e]&&this.node.insertBefore(t.node,this.node.childNodes[e]),this},put:function(t,e){return this.add(t,e),t},has:function(t){return this.index(t)>=0},index:function(t){return[].slice.call(this.node.childNodes).indexOf(t.node)},get:function(t){return b.adopt(this.node.childNodes[t])},first:function(){return this.get(0)},last:function(){return this.get(this.node.childNodes.length-1)},each:function(t,e){var i,n,r=this.children();for(i=0,n=r.length;i<n;i++)r[i]instanceof b.Element&&t.apply(r[i],[i,r]),e&&r[i]instanceof b.Container&&r[i].each(t,e);return this},removeElement:function(t){return this.node.removeChild(t.node),this},clear:function(){for(;this.node.hasChildNodes();)this.node.removeChild(this.node.lastChild);return delete this._defs,this},defs:function(){return this.doc().defs()}}}),b.extend(b.Parent,{ungroup:function(t,e){return 0===e||this instanceof b.Defs||this.node==b.parser.draw?this:(t=t||(this instanceof b.Doc?this:this.parent(b.Parent)),e=e||1/0,this.each(function(){return this instanceof b.Defs?this:this instanceof b.Parent?this.ungroup(t,e-1):this.toParent(t)}),this.node.firstChild||this.remove(),this)},flatten:function(t,e){return this.ungroup(t,e)}}),b.Container=b.invent({create:function(t){this.constructor.call(this,t)},inherit:b.Parent}),b.ViewBox=b.invent({create:function(t){var e,i,n,r,s,o,a,h=[0,0,0,0],u=1,l=1,c=/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi;if(t instanceof b.Element){for(o=t,a=t,s=(t.attr("viewBox")||"").match(c),t.bbox,n=new b.Number(t.width()),r=new b.Number(t.height());"%"==n.unit;)u*=n.value,n=new b.Number(o instanceof b.Doc?o.parent().offsetWidth:o.parent().width()),o=o.parent();for(;"%"==r.unit;)l*=r.value,r=new b.Number(a instanceof b.Doc?a.parent().offsetHeight:a.parent().height()),a=a.parent();this.x=0,this.y=0,this.width=n*u,this.height=r*l,this.zoom=1,s&&(e=parseFloat(s[0]),i=parseFloat(s[1]),n=parseFloat(s[2]),r=parseFloat(s[3]),this.zoom=this.width/this.height>n/r?this.height/r:this.width/n,this.x=e,this.y=i,this.width=n,this.height=r)}else t="string"==typeof t?t.match(c).map(function(t){return parseFloat(t)}):Array.isArray(t)?t:"object"==typeof t?[t.x,t.y,t.width,t.height]:4==arguments.length?[].slice.call(arguments):h,this.x=t[0],this.y=t[1],this.width=t[2],this.height=t[3]},extend:{toString:function(){return this.x+" "+this.y+" "+this.width+" "+this.height},morph:function(t,e,i,n){return this.destination=new b.ViewBox(t,e,i,n),this},at:function(t){return this.destination?new b.ViewBox([this.x+(this.destination.x-this.x)*t,this.y+(this.destination.y-this.y)*t,this.width+(this.destination.width-this.width)*t,this.height+(this.destination.height-this.height)*t]):this}},parent:b.Container,construct:{viewbox:function(t,e,i,n){return 0==arguments.length?new b.ViewBox(this):this.attr("viewBox",new b.ViewBox(t,e,i,n))}}}),["click","dblclick","mousedown","mouseup","mouseover","mouseout","mousemove","mouseenter","mouseleave","touchstart","touchmove","touchleave","touchend","touchcancel"].forEach(function(t){b.Element.prototype[t]=function(e){return null==e?b.off(this,t):b.on(this,t,e),this}}),b.listenerId=0,b.on=function(t,e,i,n,r){var s=i.bind(n||t),o=t instanceof b.Element?t.node:t;o.instance=o.instance||{_events:{}};var a=o.instance._events;i._svgjsListenerId||(i._svgjsListenerId=++b.listenerId),e.split(b.regex.delimiter).forEach(function(t){var e=t.split(".")[0],n=t.split(".")[1]||"*";a[e]=a[e]||{},a[e][n]=a[e][n]||{},a[e][n][i._svgjsListenerId]=s,o.addEventListener(e,s,r||!1)})},b.off=function(t,e,i,n){var r=t instanceof b.Element?t.node:t;if(r.instance&&("function"!=typeof i||(i=i._svgjsListenerId))){var s=r.instance._events;(e||"").split(b.regex.delimiter).forEach(function(t){var e,o,a=t&&t.split(".")[0],h=t&&t.split(".")[1];if(i)s[a]&&s[a][h||"*"]&&(r.removeEventListener(a,s[a][h||"*"][i],n||!1),delete s[a][h||"*"][i]);else if(a&&h){if(s[a]&&s[a][h]){for(o in s[a][h])b.off(r,[a,h].join("."),o);delete s[a][h]}}else if(h)for(t in s)for(e in s[t])h===e&&b.off(r,[t,h].join("."));else if(a){if(s[a]){for(e in s[a])b.off(r,[a,e].join("."));delete s[a]}}else{for(t in s)b.off(r,t);r.instance._events={}}})}},b.extend(b.Element,{on:function(t,e,i,n){return b.on(this,t,e,i,n),this},off:function(t,e){return b.off(this.node,t,e),this},fire:function(e,i){return e instanceof t.Event?this.node.dispatchEvent(e):this.node.dispatchEvent(e=new b.CustomEvent(e,{detail:i,cancelable:!0})),this._event=e,this},event:function(){return this._event}}),b.Defs=b.invent({create:"defs",inherit:b.Container}),b.G=b.invent({create:"g",inherit:b.Container,extend:{x:function(t){return null==t?this.transform("x"):this.transform({x:t-this.x()},!0)},y:function(t){return null==t?this.transform("y"):this.transform({y:t-this.y()},!0)},cx:function(t){return null==t?this.gbox().cx:this.x(t-this.gbox().width/2)},cy:function(t){return null==t?this.gbox().cy:this.y(t-this.gbox().height/2)},gbox:function(){var t=this.bbox(),e=this.transform();return t.x+=e.x,t.x2+=e.x,t.cx+=e.x,t.y+=e.y,t.y2+=e.y,t.cy+=e.y,t}},construct:{group:function(){return this.put(new b.G)}}}),b.Doc=b.invent({create:function(t){t&&(t="string"==typeof t?e.getElementById(t):t,"svg"==t.nodeName?this.constructor.call(this,t):(this.constructor.call(this,b.create("svg")),t.appendChild(this.node),this.size("100%","100%")),this.namespace().defs())},inherit:b.Container,extend:{namespace:function(){return this.attr({xmlns:b.ns,version:"1.1"}).attr("xmlns:xlink",b.xlink,b.xmlns).attr("xmlns:svgjs",b.svgjs,b.xmlns)},defs:function(){if(!this._defs){var t;(t=this.node.getElementsByTagName("defs")[0])?this._defs=b.adopt(t):this._defs=new b.Defs,this.node.appendChild(this._defs.node)}return this._defs},parent:function(){return this.node.parentNode&&"#document"!=this.node.parentNode.nodeName&&"#document-fragment"!=this.node.parentNode.nodeName?this.node.parentNode:null},spof:function(){var t=this.node.getScreenCTM();return t&&this.style("left",-t.e%1+"px").style("top",-t.f%1+"px"),this},remove:function(){return this.parent()&&this.parent().removeChild(this.node),this},clear:function(){for(;this.node.hasChildNodes();)this.node.removeChild(this.node.lastChild);return delete this._defs,b.parser.draw.parentNode||this.node.appendChild(b.parser.draw),this},clone:function(t){this.writeDataToDom();var e=this.node,i=x(e.cloneNode(!0));return t?(t.node||t).appendChild(i.node):e.parentNode.insertBefore(i.node,e.nextSibling),i}}}),b.extend(b.Element,{siblings:function(){return this.parent().children()},position:function(){return this.parent().index(this)},next:function(){return this.siblings()[this.position()+1]},previous:function(){return this.siblings()[this.position()-1]},forward:function(){var t=this.position()+1,e=this.parent();return e.removeElement(this).add(this,t),e instanceof b.Doc&&e.node.appendChild(e.defs().node),this},backward:function(){var t=this.position();return t>0&&this.parent().removeElement(this).add(this,t-1),this},front:function(){var t=this.parent();return t.node.appendChild(this.node),t instanceof b.Doc&&t.node.appendChild(t.defs().node),this},back:function(){return this.position()>0&&this.parent().removeElement(this).add(this,0),this},before:function(t){t.remove();var e=this.position();return this.parent().add(t,e),this},after:function(t){t.remove();var e=this.position();return this.parent().add(t,e+1),this}}),b.Mask=b.invent({create:function(){this.constructor.call(this,b.create("mask")),this.targets=[]},inherit:b.Container,extend:{remove:function(){for(var t=this.targets.length-1;t>=0;t--)this.targets[t]&&this.targets[t].unmask();return this.targets=[],b.Element.prototype.remove.call(this),this}},construct:{mask:function(){return this.defs().put(new b.Mask)}}}),b.extend(b.Element,{maskWith:function(t){return this.masker=t instanceof b.Mask?t:this.parent().mask().add(t),this.masker.targets.push(this),this.attr("mask",'url("#'+this.masker.attr("id")+'")')},unmask:function(){return delete this.masker,this.attr("mask",null)}}),b.ClipPath=b.invent({create:function(){this.constructor.call(this,b.create("clipPath")),this.targets=[]},inherit:b.Container,extend:{remove:function(){for(var t=this.targets.length-1;t>=0;t--)this.targets[t]&&this.targets[t].unclip();return this.targets=[],this.parent().removeElement(this),this}},construct:{clip:function(){return this.defs().put(new b.ClipPath)}}}),b.extend(b.Element,{clipWith:function(t){return this.clipper=t instanceof b.ClipPath?t:this.parent().clip().add(t),this.clipper.targets.push(this),this.attr("clip-path",'url("#'+this.clipper.attr("id")+'")')},unclip:function(){return delete this.clipper,this.attr("clip-path",null)}}),b.Gradient=b.invent({create:function(t){this.constructor.call(this,b.create(t+"Gradient")),this.type=t},inherit:b.Container,extend:{at:function(t,e,i){return this.put(new b.Stop).update(t,e,i)},update:function(t){return this.clear(),"function"==typeof t&&t.call(this,this),this},fill:function(){return"url(#"+this.id()+")"},toString:function(){return this.fill()},attr:function(t,e,i){return"transform"==t&&(t="gradientTransform"),b.Container.prototype.attr.call(this,t,e,i)}},construct:{gradient:function(t,e){return this.defs().gradient(t,e)}}}),b.extend(b.Gradient,b.FX,{from:function(t,e){return"radial"==(this._target||this).type?this.attr({fx:new b.Number(t),fy:new b.Number(e)}):this.attr({x1:new b.Number(t),y1:new b.Number(e)})},to:function(t,e){return"radial"==(this._target||this).type?this.attr({cx:new b.Number(t),cy:new b.Number(e)}):this.attr({x2:new b.Number(t),y2:new b.Number(e)})}}),b.extend(b.Defs,{gradient:function(t,e){return this.put(new b.Gradient(t)).update(e)}}),b.Stop=b.invent({create:"stop",inherit:b.Element,extend:{update:function(t){return("number"==typeof t||t instanceof b.Number)&&(t={offset:arguments[0],color:arguments[1],opacity:arguments[2]}),null!=t.opacity&&this.attr("stop-opacity",t.opacity),null!=t.color&&this.attr("stop-color",t.color),null!=t.offset&&this.attr("offset",new b.Number(t.offset)),this}}}),b.Pattern=b.invent({create:"pattern",inherit:b.Container,extend:{fill:function(){return"url(#"+this.id()+")"},update:function(t){return this.clear(),"function"==typeof t&&t.call(this,this),this},toString:function(){return this.fill()},attr:function(t,e,i){return"transform"==t&&(t="patternTransform"),b.Container.prototype.attr.call(this,t,e,i)}},construct:{pattern:function(t,e,i){return this.defs().pattern(t,e,i)}}}),b.extend(b.Defs,{pattern:function(t,e,i){return this.put(new b.Pattern).update(i).attr({x:0,y:0,width:t,height:e,patternUnits:"userSpaceOnUse"})}}),b.Shape=b.invent({create:function(t){this.constructor.call(this,t)},inherit:b.Element}),b.Bare=b.invent({create:function(t,e){if(this.constructor.call(this,b.create(t)),e)for(var i in e.prototype)"function"==typeof e.prototype[i]&&(this[i]=e.prototype[i])},inherit:b.Element,extend:{words:function(t){for(;this.node.hasChildNodes();)this.node.removeChild(this.node.lastChild);return this.node.appendChild(e.createTextNode(t)),this}}}),b.extend(b.Parent,{element:function(t,e){return this.put(new b.Bare(t,e))}}),b.Symbol=b.invent({create:"symbol",inherit:b.Container,construct:{symbol:function(){return this.put(new b.Symbol)}}}),b.Use=b.invent({create:"use",inherit:b.Shape,extend:{element:function(t,e){return this.attr("href",(e||"")+"#"+t,b.xlink)}},construct:{use:function(t,e){return this.put(new b.Use).element(t,e)}}}),b.Rect=b.invent({create:"rect",inherit:b.Shape,construct:{rect:function(t,e){return this.put(new b.Rect).size(t,e)}}}),b.Circle=b.invent({create:"circle",inherit:b.Shape,construct:{circle:function(t){return this.put(new b.Circle).rx(new b.Number(t).divide(2)).move(0,0)}}}),b.extend(b.Circle,b.FX,{rx:function(t){return this.attr("r",t)},ry:function(t){return this.rx(t)}}),b.Ellipse=b.invent({create:"ellipse",inherit:b.Shape,construct:{ellipse:function(t,e){return this.put(new b.Ellipse).size(t,e).move(0,0)}}}),b.extend(b.Ellipse,b.Rect,b.FX,{rx:function(t){return this.attr("rx",t)},ry:function(t){return this.attr("ry",t)}}),b.extend(b.Circle,b.Ellipse,{x:function(t){return null==t?this.cx()-this.rx():this.cx(t+this.rx())},y:function(t){return null==t?this.cy()-this.ry():this.cy(t+this.ry())},cx:function(t){return null==t?this.attr("cx"):this.attr("cx",t)},cy:function(t){return null==t?this.attr("cy"):this.attr("cy",t)},width:function(t){return null==t?2*this.rx():this.rx(new b.Number(t).divide(2))},height:function(t){return null==t?2*this.ry():this.ry(new b.Number(t).divide(2))},size:function(t,e){var i=l(this,t,e);return this.rx(new b.Number(i.width).divide(2)).ry(new b.Number(i.height).divide(2))}}),b.Line=b.invent({create:"line",inherit:b.Shape,extend:{array:function(){return new b.PointArray([[this.attr("x1"),this.attr("y1")],[this.attr("x2"),this.attr("y2")]])},plot:function(t,e,i,n){return null==t?this.array():(t=void 0!==e?{x1:t,y1:e,x2:i,y2:n}:new b.PointArray(t).toLine(),this.attr(t))},move:function(t,e){return this.attr(this.array().move(t,e).toLine())},size:function(t,e){var i=l(this,t,e);return this.attr(this.array().size(i.width,i.height).toLine())}},construct:{line:function(t,e,i,n){return b.Line.prototype.plot.apply(this.put(new b.Line),null!=t?[t,e,i,n]:[0,0,0,0])}}}),b.Polyline=b.invent({create:"polyline",inherit:b.Shape,construct:{polyline:function(t){return this.put(new b.Polyline).plot(t||new b.PointArray)}}}),b.Polygon=b.invent({create:"polygon",inherit:b.Shape,construct:{polygon:function(t){return this.put(new b.Polygon).plot(t||new b.PointArray)}}}),b.extend(b.Polyline,b.Polygon,{array:function(){return this._array||(this._array=new b.PointArray(this.attr("points")))},plot:function(t){return null==t?this.array():this.clear().attr("points","string"==typeof t?t:this._array=new b.PointArray(t))},clear:function(){return delete this._array,this},move:function(t,e){return this.attr("points",this.array().move(t,e))},size:function(t,e){var i=l(this,t,e);return this.attr("points",this.array().size(i.width,i.height))}}),b.extend(b.Line,b.Polyline,b.Polygon,{morphArray:b.PointArray,x:function(t){return null==t?this.bbox().x:this.move(t,this.bbox().y)},y:function(t){return null==t?this.bbox().y:this.move(this.bbox().x,t)},width:function(t){var e=this.bbox();return null==t?e.width:this.size(t,e.height)},height:function(t){var e=this.bbox();return null==t?e.height:this.size(e.width,t)}}),b.Path=b.invent({create:"path",inherit:b.Shape,extend:{morphArray:b.PathArray,array:function(){return this._array||(this._array=new b.PathArray(this.attr("d")))},plot:function(t){return null==t?this.array():this.clear().attr("d","string"==typeof t?t:this._array=new b.PathArray(t))},clear:function(){return delete this._array,this},move:function(t,e){return this.attr("d",this.array().move(t,e))},x:function(t){return null==t?this.bbox().x:this.move(t,this.bbox().y)},y:function(t){return null==t?this.bbox().y:this.move(this.bbox().x,t)},size:function(t,e){var i=l(this,t,e);return this.attr("d",this.array().size(i.width,i.height))},width:function(t){return null==t?this.bbox().width:this.size(t,this.bbox().height)},height:function(t){return null==t?this.bbox().height:this.size(this.bbox().width,t)}},construct:{path:function(t){return this.put(new b.Path).plot(t||new b.PathArray)}}}),b.Image=b.invent({create:"image",inherit:b.Shape,extend:{load:function(e){if(!e)return this;var i=this,n=new t.Image;return b.on(n,"load",function(){b.off(n);var t=i.parent(b.Pattern);null!==t&&(0==i.width()&&0==i.height()&&i.size(n.width,n.height),t&&0==t.width()&&0==t.height()&&t.size(i.width(),i.height()),"function"==typeof i._loaded&&i._loaded.call(i,{width:n.width,height:n.height,ratio:n.width/n.height,url:e}))}),b.on(n,"error",function(t){b.off(n),"function"==typeof i._error&&i._error.call(i,t)}),this.attr("href",n.src=this.src=e,b.xlink)},loaded:function(t){return this._loaded=t,this},error:function(t){return this._error=t,this}},construct:{image:function(t,e,i){return this.put(new b.Image).load(t).size(e||0,i||e||0)}}}),b.Text=b.invent({create:function(){this.constructor.call(this,b.create("text")),this.dom.leading=new b.Number(1.3),this._rebuild=!0,this._build=!1,this.attr("font-family",b.defaults.attrs["font-family"])},inherit:b.Shape,extend:{x:function(t){return null==t?this.attr("x"):this.attr("x",t)},y:function(t){var e=this.attr("y"),i="number"==typeof e?e-this.bbox().y:0;return null==t?"number"==typeof e?e-i:e:this.attr("y","number"==typeof t.valueOf()?t+i:t)},cx:function(t){return null==t?this.bbox().cx:this.x(t-this.bbox().width/2)},cy:function(t){return null==t?this.bbox().cy:this.y(t-this.bbox().height/2)},text:function(t){if(void 0===t){for(var t="",e=this.node.childNodes,i=0,n=e.length;i<n;++i)0!=i&&3!=e[i].nodeType&&1==b.adopt(e[i]).dom.newLined&&(t+="\n"),t+=e[i].textContent;return t}if(this.clear().build(!0),"function"==typeof t)t.call(this,this);else{t=t.split("\n");for(var i=0,r=t.length;i<r;i++)this.tspan(t[i]).newLine()}return this.build(!1).rebuild()},size:function(t){return this.attr("font-size",t).rebuild()},leading:function(t){return null==t?this.dom.leading:(this.dom.leading=new b.Number(t),this.rebuild())},lines:function(){var t=(this.textPath&&this.textPath()||this).node,e=b.utils.map(b.utils.filterSVGElements(t.childNodes),function(t){return b.adopt(t)});return new b.Set(e)},rebuild:function(t){if("boolean"==typeof t&&(this._rebuild=t),this._rebuild){var e=this,i=0,n=this.dom.leading*new b.Number(this.attr("font-size"));this.lines().each(function(){this.dom.newLined&&(e.textPath()||this.attr("x",e.attr("x")),"\n"==this.text()?i+=n:(this.attr("dy",n+i),i=0))}),this.fire("rebuild")}return this},build:function(t){return this._build=!!t,this},setData:function(t){return this.dom=t,this.dom.leading=new b.Number(t.leading||1.3),this}},construct:{text:function(t){return this.put(new b.Text).text(t)},plain:function(t){return this.put(new b.Text).plain(t)}}}),b.Tspan=b.invent({create:"tspan",inherit:b.Shape,extend:{text:function(t){return null==t?this.node.textContent+(this.dom.newLined?"\n":""):("function"==typeof t?t.call(this,this):this.plain(t),this)},dx:function(t){return this.attr("dx",t)},dy:function(t){return this.attr("dy",t)},newLine:function(){var t=this.parent(b.Text);return this.dom.newLined=!0,this.dy(t.dom.leading*t.attr("font-size")).attr("x",t.x())}}}),b.extend(b.Text,b.Tspan,{plain:function(t){return!1===this._build&&this.clear(),this.node.appendChild(e.createTextNode(t)),this},tspan:function(t){var e=(this.textPath&&this.textPath()||this).node,i=new b.Tspan;return!1===this._build&&this.clear(),e.appendChild(i.node),i.text(t)},clear:function(){for(var t=(this.textPath&&this.textPath()||this).node;t.hasChildNodes();)t.removeChild(t.lastChild);return this},length:function(){return this.node.getComputedTextLength()}}),b.TextPath=b.invent({create:"textPath",inherit:b.Parent,parent:b.Text,construct:{morphArray:b.PathArray,path:function(t){for(var e=new b.TextPath,i=this.doc().defs().path(t);this.node.hasChildNodes();)e.node.appendChild(this.node.firstChild);return this.node.appendChild(e.node),e.attr("href","#"+i,b.xlink),this},array:function(){var t=this.track();return t?t.array():null},plot:function(t){var e=this.track(),i=null;return e&&(i=e.plot(t)),null==t?i:this},track:function(){var t=this.textPath();if(t)return t.reference("href")},textPath:function(){if(this.node.firstChild&&"textPath"==this.node.firstChild.nodeName)return b.adopt(this.node.firstChild)}}}),b.Nested=b.invent({create:function(){this.constructor.call(this,b.create("svg")),this.style("overflow","visible")},inherit:b.Container,construct:{nested:function(){return this.put(new b.Nested)}}}),b.A=b.invent({create:"a",inherit:b.Container,extend:{to:function(t){return this.attr("href",t,b.xlink)},show:function(t){return this.attr("show",t,b.xlink)},target:function(t){return this.attr("target",t)}},construct:{link:function(t){return this.put(new b.A).to(t)}}}),b.extend(b.Element,{linkTo:function(t){var e=new b.A;return"function"==typeof t?t.call(e,e):e.to(t),this.parent().put(e).put(this)}}),b.Marker=b.invent({create:"marker",inherit:b.Container,extend:{width:function(t){return this.attr("markerWidth",t)},height:function(t){return this.attr("markerHeight",t)},ref:function(t,e){return this.attr("refX",t).attr("refY",e)},update:function(t){return this.clear(),"function"==typeof t&&t.call(this,this),this},toString:function(){return"url(#"+this.id()+")"}},construct:{marker:function(t,e,i){return this.defs().marker(t,e,i)}}}),b.extend(b.Defs,{marker:function(t,e,i){return this.put(new b.Marker).size(t,e).ref(t/2,e/2).viewbox(0,0,t,e).attr("orient","auto").update(i)}}),b.extend(b.Line,b.Polyline,b.Polygon,b.Path,{marker:function(t,e,i,n){var r=["marker"];return"all"!=t&&r.push(t),r=r.join("-"),t=arguments[1]instanceof b.Marker?arguments[1]:this.doc().marker(e,i,n),this.attr(r,t)}});var M={stroke:["color","width","opacity","linecap","linejoin","miterlimit","dasharray","dashoffset"],fill:["color","opacity","rule"],prefix:function(t,e){return"color"==e?t:t+"-"+e}};["fill","stroke"].forEach(function(t){var e,i={};i[t]=function(i){if(void 0===i)return this;if("string"==typeof i||b.Color.isRgb(i)||i&&"function"==typeof i.fill)this.attr(t,i);else for(e=M[t].length-1;e>=0;e--)null!=i[M[t][e]]&&this.attr(M.prefix(t,M[t][e]),i[M[t][e]]);return this},b.extend(b.Element,b.FX,i)}),b.extend(b.Element,b.FX,{rotate:function(t,e,i){return this.transform({rotation:t,cx:e,cy:i})},skew:function(t,e,i,n){return 1==arguments.length||3==arguments.length?this.transform({skew:t,cx:e,cy:i}):this.transform({skewX:t,skewY:e,cx:i,cy:n})},scale:function(t,e,i,n){return 1==arguments.length||3==arguments.length?this.transform({scale:t,cx:e,cy:i}):this.transform({scaleX:t,scaleY:e,cx:i,cy:n})},translate:function(t,e){return this.transform({x:t,y:e})},flip:function(t,e){return e="number"==typeof t?t:e,this.transform({flip:t||"both",offset:e})},matrix:function(t){return this.attr("transform",new b.Matrix(6==arguments.length?[].slice.call(arguments):t))},opacity:function(t){return this.attr("opacity",t)},dx:function(t){return this.x(new b.Number(t).plus(this instanceof b.FX?0:this.x()),!0)},dy:function(t){return this.y(new b.Number(t).plus(this instanceof b.FX?0:this.y()),!0)},dmove:function(t,e){return this.dx(t).dy(e)}}),b.extend(b.Rect,b.Ellipse,b.Circle,b.Gradient,b.FX,{radius:function(t,e){var i=(this._target||this).type;return"radial"==i||"circle"==i?this.attr("r",new b.Number(t)):this.rx(t).ry(null==e?t:e)}}),b.extend(b.Path,{length:function(){return this.node.getTotalLength()},pointAt:function(t){return this.node.getPointAtLength(t)}}),b.extend(b.Parent,b.Text,b.Tspan,b.FX,{font:function(t,e){if("object"==typeof t)for(e in t)this.font(e,t[e]);return"leading"==t?this.leading(e):"anchor"==t?this.attr("text-anchor",e):"size"==t||"family"==t||"weight"==t||"stretch"==t||"variant"==t||"style"==t?this.attr("font-"+t,e):this.attr(t,e)}}),b.Set=b.invent({create:function(t){t instanceof b.Set?this.members=t.members.slice():Array.isArray(t)?this.members=t:this.clear()},extend:{add:function(){var t,e,i=[].slice.call(arguments);for(t=0,e=i.length;t<e;t++)this.members.push(i[t]);return this},remove:function(t){var e=this.index(t);return e>-1&&this.members.splice(e,1),this},each:function(t){for(var e=0,i=this.members.length;e<i;e++)t.apply(this.members[e],[e,this.members]);return this},clear:function(){return this.members=[],this},length:function(){return this.members.length},has:function(t){return this.index(t)>=0},index:function(t){return this.members.indexOf(t)},get:function(t){return this.members[t]},first:function(){return this.get(0)},last:function(){return this.get(this.members.length-1)},valueOf:function(){return this.members},bbox:function(){if(0==this.members.length)return new b.RBox;var t=this.members[0].rbox(this.members[0].doc());return this.each(function(){t=t.merge(this.rbox(this.doc()))}),t}},construct:{set:function(t){
            return new b.Set(t)}}}),b.FX.Set=b.invent({create:function(t){this.set=t}}),b.Set.inherit=function(){var t,e=[];for(var t in b.Shape.prototype)"function"==typeof b.Shape.prototype[t]&&"function"!=typeof b.Set.prototype[t]&&e.push(t);e.forEach(function(t){b.Set.prototype[t]=function(){for(var e=0,i=this.members.length;e<i;e++)this.members[e]&&"function"==typeof this.members[e][t]&&this.members[e][t].apply(this.members[e],arguments);return"animate"==t?this.fx||(this.fx=new b.FX.Set(this)):this}}),e=[];for(var t in b.FX.prototype)"function"==typeof b.FX.prototype[t]&&"function"!=typeof b.FX.Set.prototype[t]&&e.push(t);e.forEach(function(t){b.FX.Set.prototype[t]=function(){for(var e=0,i=this.set.members.length;e<i;e++)this.set.members[e].fx[t].apply(this.set.members[e].fx,arguments);return this}})},b.extend(b.Element,{data:function(t,e,i){if("object"==typeof t)for(e in t)this.data(e,t[e]);else if(arguments.length<2)try{return JSON.parse(this.attr("data-"+t))}catch(e){return this.attr("data-"+t)}else this.attr("data-"+t,null===e?null:!0===i||"string"==typeof e||"number"==typeof e?e:JSON.stringify(e));return this}}),b.extend(b.Element,{remember:function(t,e){if("object"==typeof arguments[0])for(var e in t)this.remember(e,t[e]);else{if(1==arguments.length)return this.memory()[t];this.memory()[t]=e}return this},forget:function(){if(0==arguments.length)this._memory={};else for(var t=arguments.length-1;t>=0;t--)delete this.memory()[arguments[t]];return this},memory:function(){return this._memory||(this._memory={})}}),b.get=function(t){var i=e.getElementById(v(t)||t);return b.adopt(i)},b.select=function(t,i){return new b.Set(b.utils.map((i||e).querySelectorAll(t),function(t){return b.adopt(t)}))},b.extend(b.Parent,{select:function(t){return b.select(t,this.node)}});var k="abcdef".split("");if("function"!=typeof t.CustomEvent){var S=function(t,i){i=i||{bubbles:!1,cancelable:!1,detail:void 0};var n=e.createEvent("CustomEvent");return n.initCustomEvent(t,i.bubbles,i.cancelable,i.detail),n};S.prototype=t.Event.prototype,b.CustomEvent=S}else b.CustomEvent=t.CustomEvent;return function(e){for(var i=0,n=["moz","webkit"],r=0;r<n.length&&!t.requestAnimationFrame;++r)e.requestAnimationFrame=e[n[r]+"RequestAnimationFrame"],e.cancelAnimationFrame=e[n[r]+"CancelAnimationFrame"]||e[n[r]+"CancelRequestAnimationFrame"];e.requestAnimationFrame=e.requestAnimationFrame||function(t){var n=(new Date).getTime(),r=Math.max(0,16-(n-i)),s=e.setTimeout(function(){t(n+r)},r);return i=n+r,s},e.cancelAnimationFrame=e.cancelAnimationFrame||e.clearTimeout}(t),b});
},{}],9:[function(require,module,exports){
'use strict'
jQuery(function($){
    
    var popup = {
        init:function(){
            this.init_cache();
            this.events();
        },

        init_cache:function(){
            this.$overlay = $('.js-overlay');
            this.$btn_close = $('.js-close-popup');
            this.$btn_call = $('.js-call-popup');
            this.$scroll_container = $('.js-scroll-container');
        },

        events:function(){
            this.$btn_close.add(popup.$overlay).click(function(){
                popup.close_popup();
            });

            this.$btn_call.click(function(e){
                e.preventDefault();

                var $btn = $(this),
                    parameters = $btn.data('popup'),
                    $popup = $('.js-popup-' + parameters.target);

                popup.$overlay.addClass('_active');
                $popup.addClass('_active' + (parameters.mod ? " " + parameters.mod : ""));

            });

        },

        close_popup:function(){
            var $popup_active = $('.js-popup._active');

            popup.$overlay.removeClass('_active');
            $popup_active.removeClass('_active');
        }

    };

    $(window).load(function(){
        popup.init();
    });
});
},{}],10:[function(require,module,exports){
var $_ = {
  init: function () {
    this.initCache();
    this.drawSvg();

  },
  initCache: function () {
    this.$phaseTitle = $('.js-phase-title');
    this.$svg = $('.js-ecg-range');
    this.$description = $('.js-phase-description');
  },


  changePhase: function (data, ecg, heart) {
    $_.$phaseTitle.html(data.title);
    $_.$description.html(data.description);
    for (var i = 1; i < 10; i++) {
      ecg.select('.js-phase'.concat(i)).opacity(0);
    }
    ecg.select('.js-phase'.concat(data.phase)).opacity(1);
    heart.select('.js-sa-node').opacity(data.showSA);
    heart.select('.js-av-node').opacity(data.showAV);
    heart.select('.js-blue-heart').attr({"d": data.blueHeart});
    heart.select('.js-red-heart').attr({"d": data.redHeart});
    heart.select('.js-grey-heart').attr({"d": data.greyHeart});
    heart.select('.js-blue-blood-top').attr({"d": data.blueBloodTop});
    heart.select('.js-blue-blood-bottom').attr({"d": data.blueBloodBottom});
    heart.select('.js-red-blood').attr({"d": data.redBlood});

  },
  drawSvg: function () {
    var ecg = SVG("ecg-svg");
    var heart = SVG("svgHeart");
    var ecgPhases = [
      {
        id: 0,
        phase: 1,
        title: "Систола предсердий",
        description: "<p>1. В точке Рн давление достаточно для воздействия на СА-узел, который начинает генерировать нервный импульс действия.В результате этого, предсердия расширяются, всасывая кровь из сосудов и эти объемы закачиваются в желудочки с целью закрытия ПЖК. </p><p> 2. Создание контрдавления в желудочках для закрытия ПЖК.</p>  ",
        showSA: 1,
        showAV: 0,
        blueBloodBottom: 'M1149.52 2307.7l-133.77 -5.2 0.97 -25.11 133.77 5.2 -0.97 25.11zm44.22 5.39l-12.28 -32.98 -1.26 32.45 -69.09 -32.02 14.79 -31.92 69.09 32.01 -1.26 32.45zm0 0l1.26 -32.45 38.26 17.73 -39.52 14.72zm-77.51 10.08l-6.13 -16.48 71.37 -26.58 12.28 32.98 -71.37 26.58 -6.14 -16.49z',
        blueBloodTop: 'M1235.43 1929.49l-127.59 -115.21 16.84 -18.66 127.59 115.21 -16.84 18.66zm30.49 32.47l11.71 -33.18 -21.76 24.1 -32.52 -68.86 31.81 -15.03 32.52 68.86 -21.76 24.1zm0 0l21.76 -24.1 18.01 38.13 -39.77 -14.03zm-65.97 -41.93l5.85 -16.58 71.82 25.34 -11.71 33.18 -71.82 -25.34 5.86 -16.59z',
        redBlood: 'M2710.29 798.64l-9.99 -140.61 25.07 -1.78 9.99 140.61 -25.07 1.78zm-0.51 44.55l31.43 -15.82 -32.39 2.31 24.25 -72.18 33.35 11.2 -24.25 72.19 -32.39 2.31zm0 0l32.39 -2.31 -13.44 39.97 -18.96 -37.67zm-18.52 -75.94l15.71 -7.92 34.24 68.04 -31.43 15.82 -34.24 -68.04 15.71 -7.91z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.31,-224.05 50.72,-290.71 52.66,-67.48 164.26,-113.72 244.75,-143.58 116.21,-29.33 224.1,-50.3 338.71,-32.78 78.19,11.95 140.23,42.22 194.84,41.2 24.74,-0.47 15.82,-52.05 47.95,-52.12 58.37,3.82 84.32,11.74 114.88,48.29 18.33,19.87 -18.3,43.35 0.02,63.2 14.37,15.55 102.25,51.25 138.83,71.98 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -145.4,-10.5 -226.67,98.04 45.2,-22.66 98.54,-95.14 152.86,-63.08 47.42,28 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M908.96 1425.65c-3.28,-181.07 -12.27,-413.69 -15.54,-594.76 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.29 111.21,637.88 -2,66.79 -80.44,125.32 -82.99,169.52 -0.67,11.65 95.88,-133.68 97.7,-123.36 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 100.22,-175.01 93.08,-181.44 -13.12,-11.82 -67.15,103.14 -121.65,156.25 -27.23,26.54 -74.26,10.25 -86.89,20.36 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.95,-101.94 -162.58,-188.06 -47.54,-98.36 -47.55,-194.61 -29.68,-379.72 59.63,-290.49 94.66,-297.73 211.76,-503.71z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 50.24,226.18 221.44,424.77 435.62,502.64 829.37,301.59 1541.44,67.03 980.17,-536.15 -133.04,-142.97 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 142.98,-1.33 177.96,-48.48l-36.75 -226.73 188.82 169.62c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 441.63,359.44 628.32,452.39 202.57,100.85 361.29,169.7 485.89,142.41 325.01,-71.23 346.07,-637.01 -134.05,-1139.31l-301.58 -284.85c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.62 -216.92,-177.77 -302.1,-275.12 -24.94,-91.18 -33.34,-228.85 -36.43,-387.08 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1365.52,963.4 1080.68,2203.26 444,2362.43 -1155.09,288.78 -2060.85,92.15 -2287.05,-812.61 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'

      },
      {
        id: 1,
        phase: 1,
        title: "Систола предсердий",
        description: "<p>1. В точке Рн давление достаточно для воздействия на СА-узел, который начинает генерировать нервный импульс действия.В результате этого, предсердия расширяются, всасывая кровь из сосудов и эти объемы закачиваются в желудочки с целью закрытия ПЖК.</p> <p> 2. Создание контрдавления в желудочках для закрытия ПЖК.</p>",
        showSA: 1,
        showAV: 0,
        blueBloodBottom: 'M1240.5 2311.24l-133.77 -5.2 0.97 -25.11 133.77 5.2 -0.97 25.11zm44.22 5.39l-12.28 -32.98 -1.26 32.45 -69.09 -32.02 14.79 -31.92 69.09 32.01 -1.26 32.45zm0 0l1.26 -32.45 38.26 17.73 -39.52 14.72zm-77.51 10.08l-6.13 -16.48 71.37 -26.58 12.28 32.98 -71.37 26.58 -6.14 -16.49z',
        blueBloodTop: 'M1326.04 2014.64l-127.59 -115.21 16.84 -18.66 127.59 115.21 -16.84 18.66zm30.49 32.47l11.71 -33.18 -21.76 24.1 -32.52 -68.86 31.81 -15.03 32.52 68.86 -21.76 24.1zm0 0l21.76 -24.1 18.01 38.13 -39.77 -14.03zm-65.97 -41.93l5.85 -16.58 71.82 25.34 -11.71 33.18 -71.82 -25.34 5.86 -16.59z',
        redBlood: 'M2728.13 912.61l-9.99 -140.61 25.07 -1.78 9.99 140.61 -25.07 1.78zm-0.51 44.55l31.43 -15.82 -32.39 2.31 24.25 -72.18 33.35 11.2 -24.25 72.19 -32.39 2.31zm0 0l32.39 -2.31 -13.44 39.97 -18.96 -37.67zm-18.52 -75.94l15.71 -7.92 34.24 68.04 -31.43 15.82 -34.24 -68.04 15.71 -7.91z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 59.76,-40.78 238.89,-78.93 353.47,-61.44 78.16,11.93 161.12,20.79 204.67,41.47 22.33,10.6 -4.67,-15.48 27.46,-15.55 58.37,3.82 84.32,11.74 114.88,48.29 18.33,19.87 0.51,20.45 18.83,40.29 14.36,15.55 91.62,57.79 120.02,94.89 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M907.85 1371.54c-3.28,-181.07 -11.16,-359.58 -14.44,-540.65 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.29 111.21,637.88 -2,66.79 -80.44,125.32 -82.99,169.52 -0.67,11.65 95.88,-133.68 97.7,-123.36 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.96,-101.94 -162.58,-188.06 -47.54,-98.35 -55.74,-246.97 -37.87,-432.08 59.63,-290.49 101.74,-299.48 218.84,-505.47z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 169.14,-181.8 257.71,-162.16 9.9,2.2 12.03,5.81 3.43,8.34 -80.65,23.67 -166.55,67.15 -183.03,158.04 50.24,226.18 221.44,424.77 435.62,502.64 829.37,301.59 1541.44,67.03 980.17,-536.15 -133.04,-142.97 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 142.98,-1.33 177.96,-48.48l-36.75 -226.73 188.82 169.62c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 441.63,359.44 628.32,452.39 202.57,100.85 361.29,169.7 485.89,142.41 325.01,-71.23 346.07,-637.01 -134.05,-1139.31l-301.58 -284.85c-63.36,17.29 -99.46,71.27 -110.09,182.16 -0.1,0.92 -5.22,-4.35 -5.13,-4.91 -25.39,-97.28 -40.29,-245.51 191.47,-248.31 33.07,-32.52 63.35,-93.36 81.48,-155.3 36.34,-124.01 24.24,-276.98 -110.67,-388.25 -465.64,-384.07 -1298.41,-93.02 -1010.47,488.95 62.79,126.94 511.02,452.39 578.02,452.39 28.12,-101.78 159.27,-160.3 227.94,-102.83 0.74,0.62 1.68,4.1 0.69,4.79 -90.81,-14.54 -169.58,28.01 -159.24,123.58 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.62 -216.92,-177.77 -302.1,-275.12 -24.94,-91.18 -33.34,-228.85 -36.43,-387.08 31.94,-100.08 69.25,-109.93 136.97,-174.21 301.61,-286.35 1112.44,-193.39 1141.54,300.78 5.4,91.66 -22.76,197.46 -102.75,319.16 1365.52,963.4 1080.68,2203.26 444,2362.43 -1155.09,288.78 -2060.85,92.15 -2287.05,-812.61 -569.66,67.02 -860.38,-412.51 -563.78,-1044.95 258.52,-551.2 985.66,-621.93 974.29,450.14 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -109.72,88.04 -109.52,219.19 0.02,10.94 -4.82,12.79 -8.18,-1.73 -35.93,-154.24 25.82,-215.65 84.19,-309.6 0,-209.43 -19.76,-405.18 -92.15,-561.29 -111.75,-240.99 -297.15,-314.69 -520.02,-212.57 -349.06,159.94 -589.41,1001.43 -160.77,1240.16 96.75,53.89 250.84,65.65 393.24,65.65z'
      },
      {
        id: 2,
        phase: 1,
        title: "Систола предсердий",
        description: "<p>1. В точке Рн давление достаточно для воздействия на СА-узел, который начинает генерировать нервный импульс действия.В результате этого, предсердия расширяются, всасывая кровь из сосудов и эти объемы закачиваются в желудочки с целью закрытия ПЖК. </p> <p> 2. Создание контрдавления в желудочках для закрытия ПЖК.</p>",
        showSA: 1,
        showAV: 0,
        blueBloodBottom: 'M1375.05 2317.2l-133.77 -5.2 0.97 -25.11 133.77 5.2 -0.97 25.11zm44.22 5.39l-12.28 -32.98 -1.26 32.45 -69.09 -32.02 14.79 -31.92 69.09 32.01 -1.26 32.45zm0 0l1.26 -32.45 38.26 17.73 -39.52 14.72zm-77.51 10.08l-6.13 -16.48 71.37 -26.58 12.28 32.98 -71.37 26.58 -6.14 -16.49z',
        blueBloodTop: 'M1450.54 2146.73l-70.01 -81.84 19.1 -16.35 70.01 81.84 -19.1 16.35zm26.06 36.12l15.87 -31.41 -24.68 21.12 -23.42 -72.46 33.48 -10.82 23.42 72.47 -24.68 21.11zm0 0l24.68 -21.11 12.97 40.13 -37.65 -19.03zm-60.04 -50.05l7.94 -15.7 67.98 34.34 -15.87 31.41 -67.98 -34.34 7.94 -15.7z',
        redBlood: 'M2802.12 1112.37l-40.01 -161.78 24.4 -6.04 40.01 161.78 -24.4 6.04zm7.09 43.98l28.27 -20.96 -31.52 7.81 11.58 -75.27 34.78 5.34 -11.58 75.27 -31.52 7.81zm0 0l31.52 -7.81 -6.41 41.69 -25.11 -33.88zm-31.22 -71.67l14.14 -10.48 45.35 61.19 -28.27 20.96 -45.35 -61.2 14.13 -10.47z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 59.76,-40.78 249.1,-104.58 363.68,-87.1 78.14,11.92 131.31,-2.6 174.84,18.05 22.3,10.58 20.22,20.34 52.35,20.26 58.37,3.82 80.28,7.02 110.84,43.56 18.33,19.87 35.7,15.55 54,35.38 14.35,15.54 55.22,80.7 83.62,117.8 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M906.13 1291.34c-3.28,-181.07 -9.44,-279.38 -12.71,-460.46 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.96,-101.95 -162.58,-188.06 -47.53,-98.35 -127.73,-276.43 -109.86,-461.53 59.63,-290.49 127.44,-394.39 289.11,-556.21z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 191.4,-151.77 279.98,-132.15 9.89,2.19 9.41,11.8 0.81,14.34 -80.63,23.66 -186.19,31.15 -202.67,122.03 50.24,226.18 221.44,424.77 435.62,502.64 829.37,301.59 1541.44,67.03 980.17,-536.15 -133.04,-142.97 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 142.98,-1.33 177.96,-48.48l-36.75 -226.73 188.82 169.62c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 441.63,359.44 628.32,452.39 202.57,100.85 361.29,169.7 485.89,142.41 325.01,-71.23 346.07,-637.01 -134.05,-1139.31l-301.58 -284.85c-63.36,17.29 -72.45,85.6 -83.09,196.48 -0.09,0.92 -5.78,-2.34 -5.68,-2.89 -25.39,-97.29 -66.73,-261.85 165.03,-264.65 33.07,-32.52 75.46,-91.05 81.48,-155.3 77.52,-828.69 -1161.32,-693.2 -1180.04,-141.61 -2.48,73.26 15.45,154.47 58.9,242.31 62.79,126.92 511.02,452.39 578.02,452.39 28.12,-101.78 168.28,-135.08 236.94,-77.61 0.72,0.61 2.92,7.1 1.93,7.8 -90.81,-14.55 -179.81,-0.22 -169.47,95.35 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.62 -216.92,-177.77 -302.1,-275.12 -24.94,-91.18 -33.34,-228.85 -36.43,-387.08 156,-488.81 1228.77,-578.31 1278.51,126.56 6.46,91.6 -22.76,197.46 -102.75,319.16 1365.52,963.4 1080.68,2203.26 444,2362.43 -1155.09,288.78 -2060.85,92.15 -2287.05,-812.61 -569.66,67.02 -932.38,-438.71 -635.78,-1071.13 258.51,-551.2 1057.65,-595.75 1046.28,476.33 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -74.53,91.32 -74.34,222.46 0.01,10.94 -4.82,13.6 -8.19,-0.93 -35.91,-154.22 -9.36,-219.73 49.02,-313.68 0,-209.43 -19.76,-405.18 -92.15,-561.29 -111.75,-240.99 -313.35,-298.15 -549.48,-232.21 -454.51,126.97 -600.04,1008.54 -131.31,1259.8 97.59,52.31 250.84,65.65 393.24,65.65z'
      },
      {
        id: 3,
        phase: 1,
        title: "Систола предсердий",
        description: "<p>1. В точке Рн давление достаточно для воздействия на СА-узел, который начинает генерировать нервный импульс действия.В результате этого, предсердия расширяются, всасывая кровь из сосудов и эти объемы закачиваются в желудочки с целью закрытия ПЖК. </p> <p> 2. Создание контрдавления в желудочках для закрытия ПЖК.</p>",
        showSA: 1,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M2166.56 2797.75l-70.01 -81.84 19.1 -16.35 70.01 81.84 -19.1 16.35zm26.06 36.12l15.87 -31.41 -24.68 21.12 -23.42 -72.46 33.48 -10.82 23.42 72.47 -24.68 21.11zm0 0l24.68 -21.11 12.97 40.13 -37.65 -19.03zm-60.04 -50.05l7.94 -15.7 67.98 34.34 -15.87 31.41 -67.98 -34.34 7.94 -15.7z',
        redBlood: 'M3183.92 2057.42l-78.65 -146.92 22.16 -11.85 78.65 146.92 -22.16 11.85zm17.72 40.87l22.23 -27.27 -28.63 15.34 -7.34 -75.8 35.03 -3.39 7.33 75.8 -28.63 15.33zm0 0l28.63 -15.33 4.07 41.98 -32.69 -26.66zm-47.92 -61.75l11.12 -13.64 59.03 48.13 -22.23 27.27 -59.03 -48.12 11.11 -13.63z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 59.76,-40.78 249.1,-104.58 363.68,-87.1 78.14,11.92 131.31,-2.6 174.84,18.05 22.3,10.58 20.22,20.34 52.35,20.26 58.37,3.82 80.28,7.02 110.84,43.56 18.33,19.87 35.7,15.55 54,35.38 14.35,15.54 55.22,80.7 83.62,117.8 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M906.13 1291.34c-3.28,-181.07 -9.44,-279.38 -12.71,-460.46 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.96,-101.95 -162.58,-188.06 -47.53,-98.35 -127.73,-276.43 -109.86,-461.53 59.63,-290.49 127.44,-394.39 289.11,-556.21z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 191.4,-151.77 279.98,-132.15 9.89,2.19 9.41,11.8 0.81,14.34 -80.63,23.66 -186.19,31.15 -202.67,122.03 50.24,226.18 221.44,424.77 435.62,502.64 829.37,301.59 1541.44,67.03 980.17,-536.15 -133.04,-142.97 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 142.98,-1.33 177.96,-48.48l-36.75 -226.73 188.82 169.62c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 441.63,359.44 628.32,452.39 202.57,100.85 361.29,169.7 485.89,142.41 325.01,-71.23 346.07,-637.01 -134.05,-1139.31l-301.58 -284.85c-63.36,17.29 -72.45,85.6 -83.09,196.48 -0.09,0.92 -5.78,-2.34 -5.68,-2.89 -25.39,-97.29 -66.73,-261.85 165.03,-264.65 33.07,-32.52 75.46,-91.05 81.48,-155.3 77.52,-828.69 -1161.32,-693.2 -1180.04,-141.61 -2.48,73.26 15.45,154.47 58.9,242.31 62.79,126.92 511.02,452.39 578.02,452.39 28.12,-101.78 168.28,-135.08 236.94,-77.61 0.72,0.61 2.92,7.1 1.93,7.8 -90.81,-14.55 -179.81,-0.22 -169.47,95.35 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.62 -216.92,-177.77 -302.1,-275.12 -24.94,-91.18 -33.34,-228.85 -36.43,-387.08 156,-488.81 1228.77,-578.31 1278.51,126.56 6.46,91.6 -22.76,197.46 -102.75,319.16 1365.52,963.4 1080.68,2203.26 444,2362.43 -1155.09,288.78 -2060.85,92.15 -2287.05,-812.61 -569.66,67.02 -932.38,-438.71 -635.78,-1071.13 258.51,-551.2 1057.65,-595.75 1046.28,476.33 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -74.53,91.32 -74.34,222.46 0.01,10.94 -4.82,13.6 -8.19,-0.93 -35.91,-154.22 -9.36,-219.73 49.02,-313.68 0,-209.43 -19.76,-405.18 -92.15,-561.29 -111.75,-240.99 -313.35,-298.15 -549.48,-232.21 -454.51,126.97 -600.04,1008.54 -131.31,1259.8 97.59,52.31 250.84,65.65 393.24,65.65z'
      },
      {
        id: 4,
        phase: 2,
        title: "Закрытие предсердно-желудочковых клапанов",
        description: "<p>1. Закрытие ПЖК<br>Pн - начало зарытия<br> Q - полное закрытие</p><p>2. В точке Q давление достаточно для воздействия на АВ-узел, который начинает генерацию нервного импульса действия </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 59.76,-40.78 252.39,-81.65 366.95,-64.2 78.12,11.9 120.73,-12.83 164.24,7.79 22.27,10.56 29.19,27.34 61.32,27.26 68.63,34.95 98.47,30.91 129.03,67.45 18.33,19.87 28.98,3.12 47.27,22.94 14.34,15.52 42.13,49.61 70.53,86.71 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M929.03 1343.71c-3.28,-181.07 -10.84,-345.97 -14.12,-527.05 51.79,-37.19 95.19,-47.09 158.4,-48.26 52.36,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -62.28,-263.33 -44.41,-448.44 74.5,-282.73 84.9,-355.12 246.56,-516.93z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 184.03,-175.04 272.62,-155.47 9.89,2.18 12.29,10.6 3.68,13.12 -80.61,23.65 -181.69,55.69 -198.18,146.57 50.24,226.18 221.44,424.77 435.62,502.64 829.37,301.59 1541.44,67.03 980.17,-536.15 -133.04,-142.97 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-18.05 -220.85 150.18 167.87c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 441.63,359.44 628.32,452.39 202.57,100.85 361.29,169.7 485.89,142.41 325.01,-71.23 346.07,-637.01 -134.05,-1139.31l-301.58 -284.85c-63.36,17.29 -86.69,80.04 -97.33,190.91 -0.08,0.93 -7.89,-3.31 -7.79,-3.88 -25.39,-97.28 -50.38,-255.29 181.38,-258.09 33.07,-32.52 75.01,-91.1 81.48,-155.3 75.02,-744.3 -1163.2,-629.18 -1180.04,-141.61 -2.53,73.26 15.45,154.47 58.9,242.31 62.79,126.92 511.02,452.39 578.02,452.39 28.12,-101.78 171.17,-156.34 239.81,-98.89 0.73,0.6 -1.17,9.16 -2.16,9.86 -90.82,-14.55 -178.6,19 -168.26,114.57 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.62 -216.92,-177.77 -302.1,-275.12 -24.94,-91.18 -33.34,-228.85 -36.43,-387.08 155.54,-424.13 1228.17,-494.37 1278.51,126.56 7.42,91.53 -22.76,197.46 -102.75,319.16 1365.52,963.4 1080.68,2203.26 444,2362.43 -1155.09,288.78 -2060.85,92.15 -2287.05,-812.61 -569.66,67.02 -878.36,-420.71 -581.79,-1053.13 258.51,-551.19 1090.39,-500.85 992.3,458.33 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -98.24,87.63 -98.07,218.78 0.02,10.92 -6.45,13.59 -9.83,-0.93 -35.89,-154.22 16,-216.05 74.38,-310 0,-209.43 -19.76,-405.18 -92.15,-561.29 -111.75,-240.99 -297.1,-266.64 -529.85,-189.66 -407.9,134.92 -561.17,975.99 -150.94,1217.25 95.44,56.13 250.84,65.65 393.24,65.65z'
      },
      {
        id: 5,
        phase: 2,
        title: "Закрытие предсердно-желудочковых клапанов",
        description: "<p>1. Закрытие ПЖК<br>Pн - начало зарытия<br> Q - полное закрытие</p><p>2. В точке Q давление достаточно для воздействия на АВ-узел, который начинает генерацию нервного импульса действия </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.31,-224.05 50.72,-290.71 52.66,-67.48 164.26,-113.72 244.75,-143.58 116.21,-29.33 224.1,-50.3 338.71,-32.78 78.19,11.95 140.23,42.22 194.84,41.2 24.74,-0.47 15.82,-52.05 47.95,-52.12 58.37,3.82 84.32,11.74 114.88,48.29 18.33,19.87 -18.3,43.35 0.02,63.2 14.37,15.55 102.25,51.25 138.83,71.98 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -145.4,-10.5 -226.67,98.04 45.2,-22.66 98.54,-95.14 152.86,-63.08 47.42,28 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M908.96 1425.65c-3.28,-181.07 -12.27,-413.69 -15.54,-594.76 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.29 111.21,637.88 -2,66.79 -80.44,125.32 -82.99,169.52 -0.67,11.65 95.88,-133.68 97.7,-123.36 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 100.22,-175.01 93.08,-181.44 -13.12,-11.82 -67.15,103.14 -121.65,156.25 -27.23,26.54 -74.26,10.25 -86.89,20.36 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.95,-101.94 -162.58,-188.06 -47.54,-98.36 -47.55,-194.61 -29.68,-379.72 59.63,-290.49 94.66,-297.73 211.76,-503.71z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 50.24,226.18 221.44,424.77 435.62,502.64 829.37,301.59 1541.44,67.03 980.17,-536.15 -133.04,-142.97 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 142.98,-1.33 177.96,-48.48l-36.75 -226.73 188.82 169.62c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 441.63,359.44 628.32,452.39 202.57,100.85 361.29,169.7 485.89,142.41 325.01,-71.23 346.07,-637.01 -134.05,-1139.31l-301.58 -284.85c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.62 -216.92,-177.77 -302.1,-275.12 -24.94,-91.18 -33.34,-228.85 -36.43,-387.08 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1365.52,963.4 1080.68,2203.26 444,2362.43 -1155.09,288.78 -2060.85,92.15 -2287.05,-812.61 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 6,
        phase: 3,
        title: "Сокращение межжелудочковой перегородки",
        description: "",
        showSA: 0,
        showAV: 1,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.31,-224.05 50.72,-290.71 52.66,-67.48 164.26,-113.72 244.75,-143.58 116.21,-29.33 224.1,-50.3 338.71,-32.78 78.19,11.95 140.23,42.22 194.84,41.2 24.74,-0.47 15.82,-52.05 47.95,-52.12 58.37,3.82 84.32,11.74 114.88,48.29 18.33,19.87 -18.3,43.35 0.02,63.2 14.37,15.55 102.25,51.25 138.83,71.98 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -145.4,-10.5 -226.67,98.04 45.2,-22.66 98.54,-95.14 152.86,-63.08 47.42,28 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M886.5 1458.24c-3.28,-181.07 10.19,-446.28 6.92,-627.35 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -36.11,-174.99 -18.24,-360.09 59.63,-290.49 50.78,-294.07 177.86,-490.75z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 50.24,226.18 222.67,421.48 435.62,502.64 657.6,250.66 1305.43,1.56 980.17,-536.15 -101.08,-167.12 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-18.05 -220.87 150.18 167.89c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 437.13,369.07 628.32,452.39 891.86,388.67 825.03,-512.13 351.84,-996.9l-301.58 -284.85c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.44,-109.28 -27.6,-225.16 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1365.52,963.4 857.54,2097.01 278.21,2327.54 -649.3,258.37 -1895.05,127.05 -2121.25,-777.72 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 7,
        phase: 3,
        title: "Сокращение межжелудочковой перегородки",
        description: "",
        showSA: 0,
        showAV: 1,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.31,-224.05 50.72,-290.71 52.66,-67.48 164.26,-113.72 244.75,-143.58 116.21,-29.33 224.1,-50.3 338.71,-32.78 78.19,11.95 140.23,42.22 194.84,41.2 24.74,-0.47 15.82,-52.05 47.95,-52.12 58.37,3.82 84.32,11.74 114.88,48.29 18.33,19.87 -18.3,43.35 0.02,63.2 14.37,15.55 102.25,51.25 138.83,71.98 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -145.4,-10.5 -226.67,98.04 45.2,-22.66 98.54,-95.14 152.86,-63.08 47.42,28 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M910.85 1458.23c-3.28,-181.07 -14.16,-446.27 -17.43,-627.34 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-148.8 -24.78,-333.91 59.63,-290.49 66.73,-333.6 208.75,-516.94z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 50.24,226.18 221.07,425.8 435.62,502.64 586.48,210.02 1213.59,-50.92 980.17,-536.15 -84.68,-176 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-19.74 -230.93 151.87 177.95c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 434.15,376.28 628.32,452.39 788.07,308.84 775.21,-550.45 351.84,-996.9l-301.58 -284.85c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -18.42,-100.82 -27.44,-223.75 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1365.52,963.4 770.27,1966.12 190.94,2196.64 -649.27,258.36 -1807.78,257.94 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 8,
        phase: 4,
        title: "Сокращение стенок желудочков",
        description: "<p>1. Сокращение миокарда</p><p>2. Сокращение происходит при аэробных процессах в мышцах</p><p>3. Создается вращательное движение крови в желудочках, кровь не должна останавливать свое движение</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 285.7,-17.1 651.93,-0.67 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M916 1391.78c-3.28,-181.07 -19.31,-379.82 -22.59,-560.9 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -529.59,-120.25 -703.59,-288.78 -107.99,-114.53 -114.36,-186.16 -198.79,-338.72 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -49.2,-152.07 -31.33,-337.18 59.63,-290.49 116.39,-341.62 220.45,-580.12z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 332.15,799.06 1816.35,665.1 1415.79,-33.51 -97.14,-169.43 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-18.49 -223.52 150.63 170.54c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 666.13,-319.2 343.12,-896.53l-292.85 -385.22c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -12.46,-99.3 -27.76,-226.6 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1216.43,1023.03 683.66,1995.89 190.94,2196.64 -594.37,242.18 -1703.49,213.11 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 9,
        phase: 4,
        title: "Сокращение стенок желудочков",
        description: "<p>1. Сокращение миокарда</p><p>2. Сокращение происходит при аэробных процессах в мышцах</p><p>3. Создается вращательное движение крови в желудочках, кровь не должна останавливать свое движение</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 333.15,-51.45 529.82,-1.49 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M903.51 1407.05c-3.28,-181.07 -6.82,-395.09 -10.09,-576.16 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -468.5,-137.7 -642.5,-306.24 -107.99,-114.53 -175.45,-168.7 -259.88,-321.27 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -39.37,-197.88 -21.5,-382.99 59.63,-290.49 95.65,-258.65 198.13,-519.04z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-22.57 -247.92 154.7 194.94c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -18.72,-103.21 -27.6,-225.16 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 10,
        phase: 5,
        title: "Напряжение мышц сердца",
        description: "<p>1. Из-за необходимости сохранить напряжение мышц, процессы носят анаэробный характер</p><p>2. В точке L открывается клапан аорты</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 333.15,-51.45 529.82,-1.49 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M903.51 1407.05c-3.28,-181.07 -6.82,-395.09 -10.09,-576.16 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -468.5,-137.7 -642.5,-306.24 -107.99,-114.53 -175.45,-168.7 -259.88,-321.27 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -39.37,-197.88 -21.5,-382.99 59.63,-290.49 95.65,-258.65 198.13,-519.04z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-22.57 -247.92 154.7 194.94c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -18.72,-103.21 -27.6,-225.16 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 11,
        phase: 5,
        title: "Напряжение мышц сердца",
        description: "<p>1. Из-за необходимости сохранить напряжение мышц, процессы носят анаэробный характер</p><p>2. В точке L открывается клапан аорты</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 333.15,-51.45 529.82,-1.49 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M903.51 1407.05c-3.28,-181.07 -6.82,-395.09 -10.09,-576.16 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -468.5,-137.7 -642.5,-306.24 -107.99,-114.53 -175.45,-168.7 -259.88,-321.27 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -39.37,-197.88 -21.5,-382.99 59.63,-290.49 95.65,-258.65 198.13,-519.04z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-22.57 -247.92 154.7 194.94c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -18.72,-103.21 -27.6,-225.16 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 12,
        phase: 6,
        title: "Открытие клапанов и быстрое изгнание крови",
        description: "<p>1. В точке L открывается клапан аорты</p><p>2. На фоне созданного напряжения мышц происходит сокращение МЖП и миокарда</p><p>3. Биохимические процессы - креатинфосфатные</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1968.56 2008.18l23.21 135.11 -24.78 4.25 -23.21 -135.11 24.78 -4.25zm-3.9 -44.38l-29.7 18.85 32 -5.5 -16.98 74.24 -34.3 -7.85 16.99 -74.24 32 -5.5zm0 0l-32 5.5 9.41 -41.11 22.59 35.61zm25.95 73.73l-14.85 9.43 -40.81 -64.31 29.7 -18.85 40.81 64.31 -14.85 9.42z',
        redBlood: 'M2659.51 1758.09l128.05 106.66 -16.09 19.31 -128.05 -106.66 16.09 -19.31zm-31.76 -31.23l-10.37 33.62 20.78 -24.95 35.24 67.51 -31.19 16.29 -35.24 -67.51 20.78 -24.95zm0 0l-20.78 24.95 -19.52 -37.38 40.3 12.43zm67.59 39.26l-5.18 16.81 -72.77 -22.45 10.37 -33.62 72.77 22.45 -5.18 16.81z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 287.3,-33.62 501.97,-7.92 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M899.59 1445.15c-3.28,-181.07 -2.9,-433.19 -6.17,-614.26 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 97.99,-42.96 81.03,-49.09 -20.28,-7.31 -76.12,13.29 -79.87,-16.85 -70.76,-567.42 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.52,47.79 -36.17,78.08 -27.06,31.94 -49.22,21.68 -46.94,23.6 40.68,34.38 73.69,-60.93 119.18,-32.14 281.86,178.49 627.5,428.84 788.32,767.15 39.27,83.45 54.75,139.11 -63.06,304.38 -447.37,305.96 -1298.34,61.63 -1570.1,-429.44 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -54.89,-233.11 -37.02,-418.22 128.48,-265.04 79.11,-249.63 209.73,-445.72z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -146.73,33.43 -214.84,-11.54 -9.79,-6.45 -8.27,-7.59 3.45,-4.95 72.75,16.43 154.47,9.26 189.45,-37.9l-19.74 -230.95 151.87 177.97c127.21,12.52 207.13,-51.63 266.75,-137.17 0.32,-0.45 7.48,-0.1 7.24,1.18 -13.44,84.34 -62.14,162.97 -183.13,201.46 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -140.44,237.59 -148.7,233.13 2.52,-11.93 235.15,-95.61 -46.81,-269.23 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -205.63,-164.89 -290.81,-262.24 -13.93,-110.56 -35.66,-238.77 -47.72,-399.96 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 127.67,-14.55 184.88,-65.92 6.58,-5.92 11.5,-1.79 6.67,6.38 -44.53,75.23 -112.41,144.15 -191.55,168.44 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 13,
        phase: 6,
        title: "Открытие клапанов и быстрое изгнание крови",
        description: "<p>1. В точке L открывается клапан аорты</p><p>2. На фоне созданного напряжения мышц происходит сокращение МЖП и миокарда</p><p>3. Биохимические процессы - креатинфосфатные</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1912.78 1693.92l26.84 180.76 -24.86 3.7 -26.84 -180.76 24.86 -3.7zm-2.88 -44.45l-30.13 18.18 32.12 -4.77 -18.67 73.82 -34.11 -8.62 18.66 -73.83 32.13 -4.78zm0 0l-32.13 4.78 10.34 -40.89 21.79 36.12zm24.26 74.31l-15.06 9.08 -39.33 -65.22 30.13 -18.18 39.33 65.23 -15.07 9.08z',
        redBlood: 'M2368.29 1571.03l139.57 91.07 -13.73 21.06 -139.57 -91.07 13.73 -21.06zm-35.18 -27.32l-6.4 34.6 17.74 -27.2 42.85 62.95 -29.08 19.8 -42.85 -62.95 17.74 -27.2zm0 0l-17.74 27.2 -23.74 -34.87 41.48 7.67zm71.7 31.14l-3.2 17.31 -74.9 -13.84 6.4 -34.6 74.89 13.84 -3.2 17.3z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 293.72,-33.43 555.44,5.13 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 127.89,-46.85 160.61,-183.75 -45.38,64.18 -170.12,160.42 -230.94,110.13 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M906.09 1403.84c-3.28,-181.07 -9.4,-391.88 -12.67,-572.95 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.82,416.3 111.21,637.88 -1.99,66.78 -84.83,114.98 -87.36,159.16 -0.66,11.64 100.25,-123.32 102.07,-113 -1.89,-17.67 107.25,-39.86 90.29,-45.98 -20.28,-7.31 -85.38,10.18 -89.13,-19.96 -70.76,-567.42 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.52,47.79 -36.17,78.08 -27.06,31.94 -32.89,25.81 -30.61,27.72 40.68,34.38 57.37,-65.06 102.85,-36.26 281.86,178.49 627.5,428.84 788.32,767.15 39.27,83.45 -20.52,214.38 -138.33,379.65 -359.18,245.64 -1336.81,-219.15 -1494.84,-504.7 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -49.19,-148.8 -31.32,-333.91 59.63,-290.49 81.41,-352.53 210.53,-571.33z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -141.82,14.32 -209.93,-30.63 -9.76,-6.44 -7.15,-11.94 4.55,-9.3 72.74,16.42 148.47,32.71 183.45,-14.45l-21.59 -242.09 153.72 189.12c127.21,12.52 170.61,-58.19 230.2,-143.7 0.3,-0.44 9.13,3.15 8.89,4.44 -13.45,84.34 -27.23,166.24 -148.22,204.73 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -155.17,214.54 -163.42,210.08 2.52,-11.93 249.87,-72.57 -32.09,-246.19 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -11.16,-130.42 -24.56,-221.61 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 108.05,-33.11 165.25,-84.46 6.57,-5.91 12.6,-3.41 7.76,4.74 -44.51,75.23 -93.87,164.34 -173.01,188.62 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 14,
        phase: 7,
        title: "Медленное изгнание крови",
        description: "<p>1. Ударный объем крови увеличивается в восходящей аорте до момента , когда давление станет достаточным, чтобы барорецепторы аорты начали генерацию импульса действия расширяющего аорту </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1865.86 1379.57l9.67 126.14 -25.05 1.92 -9.67 -126.14 25.05 -1.92zm0.28 -44.55l-31.34 15.99 32.38 -2.48 -23.86 72.32 -33.41 -11.02 23.86 -72.32 32.38 -2.48zm0 0l-32.38 2.48 13.21 -40.05 19.17 37.57zm18.95 75.84l-15.67 7.99 -34.61 -67.85 31.34 -15.99 34.61 67.85 -15.66 7.99z',
        redBlood: 'M2226.07 1397.27l96.25 95.8 -17.73 17.81 -96.25 -95.8 17.73 -17.81zm-28.88 -33.92l-13.3 32.57 22.91 -23.01 29.14 70.35 -32.5 13.47 -29.15 -70.35 22.91 -23.02zm0 0l-22.91 23.02 -16.14 -38.96 39.04 15.94zm63.86 45.08l-6.65 16.29 -70.51 -28.79 13.3 -32.57 70.51 28.79 -6.65 16.29z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 91.67,31.14 146.67,101.5 76.39,97.73 107.6,68.79 53.39,30.19 -109.62,-78.06 -93.75,-156.56 -106.25,-227.29 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 298.6,-33.27 572.11,9.82 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 46.73,-1.87 119.55,-83.14 -66.87,45.14 -129.06,59.81 -189.88,9.52 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M910.64 1398.25c-3.28,-181.07 -13.95,-386.29 -17.23,-567.36 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.67,7.82 -117.51,-22.3 -7.41,-57.99 -17.14,-143.88 -26.8,-231.22 -9.68,-87.34 -19.34,-176.2 -26.58,-240.11 -7.23,-63.92 -77.79,-116.74 -84.91,-182.37 -7.12,-65.63 42.93,-202.65 35.95,-269.14 -41.02,-389.98 -64.19,-625.8 -98.04,-948.18 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 32.06,343.3 61.54,623.76 105.12,948.1 11.33,84.35 92.04,149.34 101.91,233.15 9.24,78.5 -35.25,227.79 -27.55,276.91 18.06,114.96 27.91,169.82 48.41,283.75 2.17,1.86 -10.52,47.79 -36.17,78.08 -27.06,31.94 -32.89,25.81 -30.61,27.72 40.68,34.38 57.37,-65.06 102.85,-36.26 281.86,178.49 627.5,428.84 788.32,767.15 39.27,83.45 64.56,148.92 -53.24,314.19 -364.93,249.57 -1223.06,45.13 -1579.92,-439.25 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -53.71,-238.79 -35.84,-423.89 88.16,-267.61 87.52,-266.16 219.6,-486.94z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -141.82,14.32 -209.93,-30.63 -9.76,-6.44 -7.15,-11.94 4.55,-9.3 72.74,16.42 148.47,32.71 183.45,-14.45l-19.56 -227.69 151.69 174.72c127.21,12.52 170.61,-58.19 230.2,-143.7 0.3,-0.44 9.13,3.15 8.89,4.44 -13.45,84.34 -27.23,166.24 -148.22,204.73 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -155.17,214.54 -163.42,210.08 2.52,-11.93 249.87,-72.57 -32.09,-246.19 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -205.81,-165.09 -290.99,-262.43 -21.01,-154.84 -42.42,-274.5 -47.54,-399.76 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 108.05,-33.11 165.25,-84.46 6.57,-5.91 12.6,-3.41 7.76,4.74 -44.51,75.23 -93.87,164.34 -173.01,188.62 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 15,
        phase: 7,
        title: "Медленное изгнание крови",
        description: "<p>1. Ударный объем крови увеличивается в восходящей аорте до момента , когда давление станет достаточным, чтобы барорецепторы аорты начали генерацию импульса действия расширяющего аорту </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1863.63 1244.32l9.67 126.14 -25.05 1.92 -9.67 -126.14 25.05 -1.92zm0.28 -44.55l-31.34 15.99 32.38 -2.48 -23.86 72.32 -33.41 -11.02 23.86 -72.32 32.38 -2.48zm0 0l-32.38 2.48 13.21 -40.05 19.17 37.57zm18.95 75.84l-15.67 7.99 -34.61 -67.85 31.34 -15.99 34.61 67.85 -15.66 7.99z',
        redBlood: 'M1556.55 947.45l96.25 95.8 -17.73 17.81 -96.25 -95.8 17.73 -17.81zm-28.88 -33.92l-13.3 32.57 22.91 -23.01 29.14 70.35 -32.5 13.47 -29.15 -70.35 22.91 -23.02zm0 0l-22.91 23.02 -16.14 -38.96 39.04 15.94zm63.86 45.08l-6.65 16.29 -70.51 -28.79 13.3 -32.57 70.51 28.79 -6.65 16.29z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 295.02,-33.39 594.47,16.6 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.68,-104.06 -301.12,-177.68 -164.33,-109.52 -400.73,-246.68 -524.21,-372.62 19.64,-32.18 37.11,35.29 120.24,-70.35 -45.38,64.18 -83.94,53.56 -144.76,3.27 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -122.14,-111.96 -215.08,-194.97 -292.95,-269.32 -44.06,-42.07 -153.25,-97.09 -190.21,-137.3 -43.47,-47.3 -78.25,-171.51 -119.63,-227.32 -70.87,-95.58 -80.54,-121.21 -178.45,-289.45l-207.24 -415.4z',
        blueHeart: 'M908.72 1400.59c-3.28,-181.07 -12.03,-388.63 -15.31,-569.7 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -12.08,-96.87 -24.19,-199.35 -36.23,-305.34 -12.04,-106.01 -33.41,-207.96 -45.27,-319.05 -6.79,-63.7 -75.57,-154.11 -82.26,-218.44 -7.4,-71.03 49.62,-190.75 42.36,-261.58 -30.44,-296.58 -52.65,-520.08 -78.97,-766.6 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 25.21,269.95 57.04,490.33 88.93,747.89 9.82,79.32 87.92,163.05 98.55,241.5 8.57,63.31 -42.91,203.24 -33.73,266.06 25.83,176.73 42.83,312.41 74.15,486.46 2.17,1.86 -10.52,47.79 -36.17,78.08 -27.06,31.94 -1.76,36.96 0.51,38.88 40.68,34.38 26.24,-76.21 71.73,-47.41 281.86,178.49 627.5,428.84 788.32,767.15 39.27,83.45 -121.97,214.38 -239.78,379.65 -359.18,245.64 -1235.36,-219.15 -1393.39,-504.7 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -26.28,-282.98 -8.41,-468.08 127.91,-274.2 76.51,-258.08 190.25,-440.41z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -141.82,14.32 -209.93,-30.63 -9.76,-6.44 -7.15,-11.94 4.55,-9.3 72.74,16.42 148.47,32.71 183.45,-14.45l-17.51 -226.84 149.65 173.87c127.21,12.52 170.61,-58.19 230.2,-143.7 0.3,-0.44 9.13,3.15 8.89,4.44 -13.45,84.34 -27.23,166.24 -148.22,204.73 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -155.17,214.54 -163.42,210.08 2.52,-11.93 249.87,-72.57 -32.09,-246.19 -101.02,-41.86 -160.35,-92.91 -216.83,-133.19 -112.18,-80 -212.81,-195.87 -250.17,-280.41 -22.34,-50.55 -34.11,-68.43 -54.56,-139.56 -15.55,-91.25 -7.85,-87.77 -29.29,-255.85 31.94,-100.07 57.48,-104.91 132.45,-160.58 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 108.05,-33.11 165.25,-84.46 6.57,-5.91 12.6,-3.41 7.76,4.74 -44.51,75.23 -93.87,164.34 -173.01,188.62 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 16,
        phase: 8,
        title: "Создание максимального систолического давления в аорте",
        description: "<p>1. Расширение аорты с целью сохранения структуры кровотока и его транспортировки на периферию</p><p>2. В точке Тк - начало зарытия клапана аорты</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1802.3 619.93l9.67 126.14 -25.05 1.92 -9.67 -126.14 25.05 -1.92zm0.28 -44.55l-31.34 15.99 32.38 -2.48 -23.86 72.32 -33.41 -11.02 23.86 -72.32 32.38 -2.48zm0 0l-32.38 2.48 13.21 -40.05 19.17 37.57zm18.95 75.84l-15.67 7.99 -34.61 -67.85 31.34 -15.99 34.61 67.85 -15.66 7.99z',
        redBlood: 'M1371.5 543.25l67.84 117.65 -21.77 12.55 -67.84 -117.65 21.77 -12.55zm-18.99 -40.29l-21.36 27.95 28.13 -16.23 9.72 75.54 -34.9 4.49 -9.72 -75.54 28.13 -16.22zm0 0l-28.13 16.22 -5.38 -41.82 33.51 25.61zm49.83 60.22l-10.68 13.97 -60.52 -46.24 21.36 -27.95 60.52 46.24 -10.69 13.98z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 78.86,111.21 115.12,171.13 164.57,257.13 35.66,62.03 143.14,124.28 178.83,182.65 30.48,49.86 27.69,155.6 66.89,208.16 59.95,80.4 114.89,140.63 218.93,241.98 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 288.41,-33.59 613.2,22.76 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 -2.62,74.12 30.1,-62.78 -45.38,64.18 -39.61,39.45 -100.43,-10.84 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -303.21,-277.93 -426.48,-377.43 -586.03,-609.27 -57.1,-82.99 -122.15,-71.69 -198.49,-202.85l-52.86 -223.77 -151.11 -302.89z',
        blueHeart: 'M912.68 1425.51c-3.28,-181.07 -15.99,-413.55 -19.26,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -41.76,-334.86 -83.78,-736.4 -123.13,-1121.24 -7.98,-78.11 -71.52,-132.66 -79.27,-208.7 -7.6,-74.64 40.54,-170.89 33.23,-242.21 -10.74,-104.59 -21.17,-204.93 -31.21,-298.88 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 9.19,98.42 15.77,166.72 25.7,263.28 8.01,77.9 65.06,145.57 73.65,222.4 7.69,68.8 -30.03,176.14 -21.8,244.16 41.7,344.6 90.61,680.07 150.36,1012.07 2.17,1.86 -10.52,47.79 -36.17,78.08 -27.06,31.94 17.24,4.63 19.51,6.55 40.68,34.38 7.24,-43.88 52.73,-15.09 281.86,178.49 627.5,428.84 788.32,767.15 39.27,83.45 -118.7,302.73 -272.5,409.09 -364.93,249.57 -1206.7,-255.93 -1360.67,-534.15 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -36.11,-224.06 -18.24,-409.17 59.63,-290.49 54.89,-259.19 204.04,-474.4z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -141.82,14.32 -209.93,-30.63 -9.76,-6.44 -7.15,-11.94 4.55,-9.3 72.74,16.42 148.47,32.71 183.45,-14.45l-20.64 -236.23 152.77 183.26c127.21,12.52 170.61,-58.19 230.2,-143.7 0.3,-0.44 9.13,3.15 8.89,4.44 -13.45,84.34 -27.23,166.24 -148.22,204.73 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -155.17,214.54 -163.42,210.08 2.52,-11.93 249.87,-72.57 -32.09,-246.19 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.03,-175.7 -292.22,-273.05 -9.67,-86.61 5.06,30.28 -19.33,-173.44 9.08,-78.44 34.52,-176.41 9,-273.01 -14.77,-55.9 -18.23,-43.95 115.24,-127.73 313.81,-196.96 1091.19,-105.44 1127.28,311.6 7.92,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 108.05,-33.11 165.25,-84.46 6.57,-5.91 12.6,-3.41 7.76,4.74 -44.51,75.23 -93.87,164.34 -173.01,188.62 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 17,
        phase: 8,
        title: "Создание максимального систолического давления в аорте",
        description: "<p>1. Расширение аорты с целью сохранения структуры кровотока и его транспортировки на периферию</p><p>2. В точке Тк - начало зарытия клапана аорты</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1762.66 385.77l9.67 126.14 -25.05 1.92 -9.67 -126.14 25.05 -1.92zm0.28 -44.55l-31.34 15.99 32.38 -2.48 -23.86 72.32 -33.41 -11.02 23.86 -72.32 32.38 -2.48zm0 0l-32.38 2.48 13.21 -40.05 19.17 37.57zm18.95 75.84l-15.67 7.99 -34.61 -67.85 31.34 -15.99 34.61 67.85 -15.66 7.99z',
        redBlood: 'M1229.3 303.02l75.94 112.6 -20.84 14.05 -75.94 -112.6 20.84 -14.05zm-21.79 -38.86l-19.34 29.4 26.92 -18.17 15.01 74.66 -34.5 6.93 -15 -74.65 26.91 -18.17zm0 0l-26.91 18.17 -8.31 -41.35 35.22 23.18zm53.96 56.57l-9.68 14.69 -63.62 -41.86 19.34 -29.4 63.62 41.87 -9.67 14.69z',
        redHeart: 'M962.31 204.24c48.01,-126.67 197.25,-206.37 326.48,-199.68 6.11,8.62 12.1,17.15 17.93,25.55 45.01,64.81 119.85,89.19 152.85,144.08 48.67,80.95 50.65,187.95 92.86,259.44 82.58,139.85 175.23,275.47 365.57,460.87 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 293.58,-65.15 574.88,10.63 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 38.13,3.12 133.44,-114.99 -45.38,64.18 -142.95,91.65 -203.77,41.36 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -205.88,-188.71 -328.79,-295.16 -436.43,-416.62 -107.64,-121.47 -200.02,-257.96 -344.81,-506.76 -32.38,-64.89 -126.93,-93.79 -159.3,-158.68 -31.25,-62.64 -0.33,-161.27 -31.57,-223.91l-16.37 -32.8z',
        blueHeart: 'M905.11 1404.53c-3.28,-181.07 -8.42,-393.1 -11.7,-574.17 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -50.4,-404.23 -101.19,-905.63 -147.23,-1357.53 -8.59,-84.36 -74.32,-170.31 -82.54,-250.26 -8.1,-78.72 41.21,-151.62 33.54,-224.25 -1.38,-13.07 -2.77,-26.1 -4.15,-38.97 29.75,-174.1 332.65,-194.23 413.97,-29.46 1.01,10.85 2.05,21.71 3.06,32.51 7.5,79.68 71.68,142.26 79.68,220.72 7.49,73.44 -41.12,162.94 -33.12,235.4 47.53,430.12 104.69,844.31 178.28,1253.27 2.17,1.86 15.66,60.89 -9.99,91.17 -29.36,34.66 27.65,-33.29 46.06,-21.63 281.86,178.49 627.5,428.84 788.32,767.15 39.27,83.45 -108.88,204.55 -226.69,369.82 -359.18,245.64 -1248.45,-209.32 -1406.48,-494.88 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -39.38,-194.62 -21.51,-379.73 59.63,-290.49 78.01,-311.2 199.74,-524.3z',
        greyHeart: 'M1320.06 2558.33c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -141.82,14.32 -209.93,-30.63 -9.76,-6.44 -7.15,-11.94 4.55,-9.3 72.74,16.42 166.84,38.47 201.84,-8.68l-38.85 -240.96 152.58 182.22c127.21,12.52 170.61,-58.19 230.2,-143.7 0.3,-0.44 9.13,3.15 8.89,4.44 -13.45,84.34 -27.23,166.24 -148.22,204.73 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -155.17,214.54 -163.42,210.08 2.52,-11.93 249.87,-72.57 -32.09,-246.19 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -208.17,-184.51 -293.34,-281.87 -13.54,-156.52 -29.52,-222.15 -45.2,-380.33 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 108.05,-33.11 165.25,-84.46 6.57,-5.91 12.6,-3.41 7.76,4.74 -44.51,75.23 -93.87,164.34 -173.01,188.62 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 18,
        phase: 8,
        title: "Создание максимального систолического давления в аорте",
        description: "<p>1. Расширение аорты с целью сохранения структуры кровотока и его транспортировки на периферию</p><p>2. В точке Тк - начало зарытия клапана аорты</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1739.71 100.8l9.67 126.14 -25.05 1.92 -9.67 -126.14 25.05 -1.92zm0.28 -44.55l-31.34 15.99 32.38 -2.48 -23.86 72.32 -33.41 -11.02 23.86 -72.32 32.38 -2.48zm0 0l-32.38 2.48 13.21 -40.05 19.17 37.57zm18.95 75.84l-15.67 7.99 -34.61 -67.85 31.34 -15.99 34.61 67.85 -15.66 7.99z',
        redBlood: 'M1151.21 128.95l75.94 112.6 -20.84 14.05 -75.94 -112.6 20.84 -14.05zm-21.79 -38.86l-19.34 29.4 26.92 -18.17 15.01 74.66 -34.5 6.93 -15 -74.65 26.91 -18.17zm0 0l-26.91 18.17 -8.31 -41.35 35.22 23.18zm53.96 56.57l-9.68 14.69 -63.62 -41.86 19.34 -29.4 63.62 41.87 -9.67 14.69z',
        redHeart: 'M1288.79 5.37c12.67,-4.22 29.06,4.03 29.32,4.39 5.79,8.18 9.34,51.13 14.88,59.1 151.46,218.12 96.34,157.09 219.44,365.57 82.57,139.84 175.23,275.47 365.57,460.87 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 293.58,-65.15 574.88,10.63 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 38.13,3.12 133.44,-114.99 -45.38,64.18 -142.95,91.65 -203.77,41.36 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -205.88,-188.71 -328.79,-295.16 -436.43,-416.62 -107.64,-121.47 -200.02,-257.96 -344.81,-506.76 -63.93,-128.13 -118.3,-237.09 -182.39,-365.57 -23.26,-13.74 -29.74,-19.5 -39.24,-38.1 1.53,-6.67 105.44,-223.6 340.87,-211.41z',
        blueHeart: 'M905.11 1405.34c-3.28,-181.07 -8.42,-393.1 -11.7,-574.17 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -50.4,-404.23 -101.19,-905.63 -147.23,-1357.53 -15.63,-153.6 -33.14,-324.25 -49,-474.52 -1.38,-13.06 -21.58,-19.56 -22.96,-32.43 29.75,-174.1 367,-198.32 448.32,-33.54 1.01,10.85 -13.5,19.26 -12.49,30.06 11.68,124.16 32.89,332.37 46.56,456.12 47.53,430.12 104.69,844.31 178.28,1253.27 2.17,1.86 15.66,60.89 -9.99,91.17 -29.36,34.66 27.65,-33.29 46.06,-21.63 281.86,178.49 627.5,428.84 788.32,767.15 39.27,83.45 -108.88,204.55 -226.69,369.82 -359.18,245.64 -1248.45,-209.32 -1406.48,-494.88 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -39.38,-194.62 -21.51,-379.73 59.63,-290.49 78.01,-311.2 199.74,-524.3z',
        greyHeart: 'M1320.06 2559.14c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -141.82,14.32 -209.93,-30.63 -9.76,-6.44 -7.15,-11.94 4.55,-9.3 72.74,16.42 166.84,38.47 201.84,-8.68l-38.85 -240.96 152.58 182.22c127.21,12.52 170.61,-58.19 230.2,-143.7 0.3,-0.44 9.13,3.15 8.89,4.44 -13.45,84.34 -27.23,166.24 -148.22,204.73 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -155.17,214.54 -163.42,210.08 2.52,-11.93 249.87,-72.57 -32.09,-246.19 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -208.17,-184.51 -293.34,-281.87 -13.54,-156.52 -29.52,-222.15 -45.2,-380.33 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 108.05,-33.11 165.25,-84.46 6.57,-5.91 12.6,-3.41 7.76,4.74 -44.51,75.23 -93.87,164.34 -173.01,188.62 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 19,
        phase: 8,
        title: "Создание максимального систолического давления в аорте",
        description: "<p>1. Расширение аорты с целью сохранения структуры кровотока и его транспортировки на периферию</p><p>2. В точке Тк - начало зарытия клапана аорты</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 293.72,-33.43 555.44,5.13 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.42 184.72,150.12 97.13,98.01 125.53,314.4 188.16,407.96 86.85,129.76 73.39,247.92 149.12,430.15 33.7,128.41 44.86,71.06 40.03,242.55 -2.78,98.57 -11.84,130.71 -54.17,211.22 -87.42,113.18 -68.43,44.96 -115.84,43.42 -94.51,-3.07 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 127.89,-46.85 160.61,-183.75 -45.38,64.18 -170.12,160.42 -230.94,110.13 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M903.51 1407.05c-3.28,-181.07 -6.82,-395.09 -10.09,-576.16 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -468.5,-137.7 -642.5,-306.24 -107.99,-114.53 -175.45,-168.7 -259.88,-321.27 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -39.37,-197.88 -21.5,-382.99 59.63,-290.49 95.65,-258.65 198.13,-519.04z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -141.82,14.32 -209.93,-30.63 -9.76,-6.44 -7.15,-11.94 4.55,-9.3 72.74,16.42 148.47,32.71 183.45,-14.45l-21.59 -242.09 153.72 189.12c127.21,12.52 170.61,-58.19 230.2,-143.7 0.3,-0.44 9.13,3.15 8.89,4.44 -13.45,84.34 -27.23,166.24 -148.22,204.73 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -155.17,214.54 -163.42,210.08 2.52,-11.93 249.87,-72.57 -32.09,-246.19 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -11.16,-130.42 -24.56,-221.61 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 108.05,-33.11 165.25,-84.46 6.57,-5.91 12.6,-3.41 7.76,4.74 -44.51,75.23 -93.87,164.34 -173.01,188.62 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 20,
        phase: 9,
        title: "Закрытие полулунных клапанов. Ранняя диастола желудочков",
        description: "<p>1. В точке Uн - полное зарктие клапана аорты</p><p>2. Заполнение кровью коронарных артерий</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -477.24,-136.61 -651.23,-305.15 -107.99,-114.53 -166.71,-169.79 -251.14,-322.36 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 21,
        phase: 9,
        title: "Закрытие полулунных клапанов. Ранняя диастола желудочков",
        description: "<p>1. В точке Uн - полное зарктие клапана аорты</p><p>2. Заполнение кровью коронарных артерий</p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 333.15,-51.45 529.82,-1.49 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M903.51 1407.05c-3.28,-181.07 -6.82,-395.09 -10.09,-576.16 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -468.5,-137.7 -642.5,-306.24 -107.99,-114.53 -175.45,-168.7 -259.88,-321.27 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -39.37,-197.88 -21.5,-382.99 59.63,-290.49 95.65,-258.65 198.13,-519.04z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 122.92,-209.19 229.47,-214.92 10.17,-0.54 11.17,-1.19 3.45,3.41 -75.17,44.74 -138.32,124.84 -154.8,215.72 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -154.07,47.07 -222.2,2.1 -9.79,-6.47 -9.39,-6.52 2.36,-3.86 72.75,16.45 162.92,-5.46 197.9,-52.62l-22.57 -247.92 154.7 194.94c127.21,12.52 228.94,-46.71 288.57,-132.26 0.31,-0.45 1.57,-0.61 1.36,0.66 -13.45,84.34 -78.07,158.58 -199.06,197.07 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -134.09,67.42 -175.1,152.96 -0.41,0.87 -2.35,-0.58 -2.26,-1.11 12.23,-71.12 21.86,-220.12 253.62,-222.92 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 114.74,-163.86 199.79,-168.57 1.01,-0.05 0.79,2.33 -0.2,3.02 -66.48,49.89 -140.54,95.52 -130.2,191.09 41.17,243.89 -127.9,264.86 -136.15,260.41 2.53,-11.94 222.6,-122.89 -59.36,-296.51 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -18.72,-103.21 -27.6,-225.16 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1078.06,1133.17 629.09,2038.22 190.94,2196.64 -508.47,183.83 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 136.92,2.92 194.14,-48.47 6.6,-5.91 9.61,-6.4 4.77,1.77 -44.53,75.23 -119.77,131.32 -198.91,155.6 -54.15,37.48 -130.55,138.37 -162.7,210.61 -4.47,10.05 -6.35,7.42 -5.34,-7.48 5.44,-79.79 76.15,-201.33 134.53,-295.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 22,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: 'M1225.03 2311.3l-127.73 -10.92 2.14 -25.03 127.73 10.92 -2.14 25.03zm43.92 7.44l-10.74 -33.5 -2.76 32.36 -67.53 -35.2 16.26 -31.2 67.53 35.19 -2.76 32.36zm0 0l2.76 -32.36 37.4 19.49 -40.16 12.86zm-77.9 6.48l-5.36 -16.75 72.53 -23.23 10.74 33.5 -72.53 23.23 -5.37 -16.75z',
        blueBloodTop: 'M1310.35 2001.71l-110.52 -126.36 18.92 -16.54 110.52 126.36 -18.92 16.54zm26.47 35.84l15.51 -31.58 -24.44 21.38 -24.21 -72.2 33.36 -11.18 24.21 72.2 -24.44 21.38zm0 0l24.44 -21.38 13.41 39.98 -37.85 -18.6zm-60.59 -49.38l7.76 -15.79 68.35 33.59 -15.51 31.58 -68.35 -33.6 7.76 -15.78z',
        redBlood: 'M2726.87 912.22l-9.24 -166.39 25.09 -1.39 9.24 166.39 -25.09 1.39zm-1.22 44.54l31.67 -15.33 -32.42 1.8 25.37 -71.81 33.18 11.73 -25.37 71.81 -32.42 1.8zm0 0l32.42 -1.8 -14.05 39.77 -18.37 -37.97zm-17.35 -76.22l15.84 -7.67 33.18 68.56 -31.67 15.33 -33.18 -68.56 15.83 -7.66z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 164.43,-25.03 197.15,-161.94 -45.38,64.18 -206.66,138.6 -267.48,88.31 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -477.24,-136.61 -651.23,-305.15 -107.99,-114.53 -166.71,-169.79 -251.14,-322.36 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 141.32,-173.2 247.87,-178.91 10.15,-0.54 14.02,5.78 6.31,10.37 -75.17,44.71 -159.58,81.88 -176.06,172.76 571.79,733.7 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 648.69,-253.74 325.66,-831.08l-275.4 -450.67c-63.36,17.29 -112.62,78.48 -153.62,164 -0.42,0.85 -4.26,-0.66 -4.17,-1.19 12.24,-71.12 2.29,-231.08 234.05,-233.88 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 126.66,-141.66 211.7,-146.35 1.01,-0.05 1.77,2 0.78,2.69 -66.48,49.89 -153.44,73.63 -143.1,169.2 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1228.6,1097.17 628.93,2037.76 190.94,2196.64 -858.62,311.46 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -99.07,154.31 -131.19,226.55 -4.48,10.05 -8.82,12.32 -7.82,-2.55 5.43,-79.8 47.12,-222.19 105.5,-316.14 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 23,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: 'M1281.19 2316.11l-127.73 -10.92 2.14 -25.03 127.73 10.92 -2.14 25.03zm43.92 7.44l-10.74 -33.5 -2.76 32.36 -67.53 -35.2 16.26 -31.2 67.53 35.19 -2.76 32.36zm0 0l2.76 -32.36 37.4 19.49 -40.16 12.86zm-77.9 6.48l-5.36 -16.75 72.53 -23.23 10.74 33.5 -72.53 23.23 -5.37 -16.75z',
        blueBloodTop: 'M1369.1 2068.88l-110.52 -126.36 18.92 -16.54 110.52 126.36 -18.92 16.54zm26.47 35.84l15.51 -31.58 -24.44 21.38 -24.21 -72.2 33.36 -11.18 24.21 72.2 -24.44 21.38zm0 0l24.44 -21.38 13.41 39.98 -37.85 -18.6zm-60.59 -49.38l7.76 -15.79 68.35 33.59 -15.51 31.58 -68.35 -33.6 7.76 -15.78z',
        redBlood: 'M2752.57 1025.54l-56.73 -156.71 23.63 -8.55 56.73 156.71 -23.63 8.55zm11.66 42.99l25.92 -23.8 -30.53 11.06 3.63 -76.07 35.15 1.68 -3.63 76.06 -30.53 11.06zm0 0l30.53 -11.06 -2.01 42.13 -28.53 -31.07zm-38.54 -68.01l12.96 -11.89 51.5 56.1 -25.92 23.8 -51.5 -56.11 12.96 -11.89z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -477.24,-136.61 -651.23,-305.15 -107.99,-114.53 -166.71,-169.79 -251.14,-322.36 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 175.72,-134.34 282.22,-140.06 10.15,-0.52 12.4,3.33 4.69,7.93 -75.15,44.7 -192.31,45.47 -208.8,136.35 525.98,838.42 1874.2,649.31 1415.79,-33.51 -108.84,-162.15 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 687.94,-270.1 364.92,-847.43l-314.66 -434.31c-63.36,17.29 -88.91,89.33 -129.91,174.85 -0.41,0.86 -3.76,-0.58 -3.66,-1.09 12.23,-71.14 -21.94,-242.02 209.82,-244.82 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 147.44,-123.57 232.47,-128.26 0.99,-0.05 5.14,3.95 4.15,4.64 -66.48,49.89 -177.57,53.59 -167.23,149.16 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1343.13,1077.52 630.08,2040.96 190.94,2196.64 -1090.96,386.73 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -59.79,127.31 -76.38,241.28 -1.58,10.85 -10.75,19.36 -13.93,4.82 -20.92,-95.68 -1.58,-244.3 56.79,-338.25 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 24,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: 'M1369.07 2323.63l-127.73 -10.92 2.14 -25.03 127.73 10.92 -2.14 25.03zm43.92 7.44l-10.74 -33.5 -2.76 32.36 -67.53 -35.2 16.26 -31.2 67.53 35.19 -2.76 32.36zm0 0l2.76 -32.36 37.4 19.49 -40.16 12.86zm-77.9 6.48l-5.36 -16.75 72.53 -23.23 10.74 33.5 -72.53 23.23 -5.37 -16.75z',
        blueBloodTop: 'M1440.22 2150.21l-110.52 -126.36 18.92 -16.54 110.52 126.36 -18.92 16.54zm26.47 35.84l15.51 -31.58 -24.44 21.38 -24.21 -72.2 33.36 -11.18 24.21 72.2 -24.44 21.38zm0 0l24.44 -21.38 13.41 39.98 -37.85 -18.6zm-60.59 -49.38l7.76 -15.79 68.35 33.59 -15.51 31.58 -68.35 -33.6 7.76 -15.78z',
        redBlood: 'M2789.13 1126.55l-56.73 -156.71 23.63 -8.55 56.73 156.71 -23.63 8.55zm11.66 42.99l25.92 -23.8 -30.53 11.06 3.63 -76.07 35.15 1.68 -3.63 76.06 -30.53 11.06zm0 0l30.53 -11.06 -2.01 42.13 -28.53 -31.07zm-38.54 -68.01l12.96 -11.89 51.5 56.1 -25.92 23.8 -51.5 -56.11 12.96 -11.89z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -477.24,-136.61 -651.23,-305.15 -107.99,-114.53 -166.71,-169.79 -251.14,-322.36 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 175.72,-134.34 282.22,-140.06 10.15,-0.52 12.4,3.33 4.69,7.93 -75.15,44.7 -192.31,45.47 -208.8,136.35 508.62,907.84 1865.11,685.63 1415.79,-33.51 -103.5,-165.64 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 733.75,-279.92 410.73,-857.24l-360.47 -424.51c-63.36,17.29 -88.91,89.33 -129.91,174.85 -0.41,0.86 -3.76,-0.58 -3.66,-1.09 12.23,-71.14 -21.94,-242.02 209.82,-244.82 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 147.44,-123.57 232.47,-128.26 0.99,-0.05 5.14,3.95 4.15,4.64 -66.48,49.89 -177.57,53.59 -167.23,149.16 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1421.67,1048.08 628.86,2037.57 190.94,2196.64 -1208.76,439.09 -1529.47,152.56 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -59.79,127.31 -76.38,241.28 -1.58,10.85 -10.75,19.36 -13.93,4.82 -20.92,-95.68 -1.58,-244.3 56.79,-338.25 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 25,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: 'M1499.96 2386.62l-127.73 -10.92 2.14 -25.03 127.73 10.92 -2.14 25.03zm43.92 7.44l-10.74 -33.5 -2.76 32.36 -67.53 -35.2 16.26 -31.2 67.53 35.19 -2.76 32.36zm0 0l2.76 -32.36 37.4 19.49 -40.16 12.86zm-77.9 6.48l-5.36 -16.75 72.53 -23.23 10.74 33.5 -72.53 23.23 -5.37 -16.75z',
        blueBloodTop: 'M1544.09 2309.65l-110.52 -126.36 18.92 -16.54 110.52 126.36 -18.92 16.54zm26.47 35.84l15.51 -31.58 -24.44 21.38 -24.21 -72.2 33.36 -11.18 24.21 72.2 -24.44 21.38zm0 0l24.44 -21.38 13.41 39.98 -37.85 -18.6zm-60.59 -49.38l7.76 -15.79 68.35 33.59 -15.51 31.58 -68.35 -33.6 7.76 -15.78z',
        redBlood: 'M2862.34 1236.42l-107.45 -127.39 19.22 -16.21 107.45 127.39 -19.22 16.21zm25.82 36.3l16.09 -31.3 -24.83 20.95 -22.91 -72.63 33.55 -10.59 22.91 72.63 -24.82 20.94zm0 0l24.82 -20.94 12.69 40.22 -37.51 -19.28zm-59.69 -50.47l8.04 -15.64 67.74 34.82 -16.09 31.3 -67.74 -34.82 8.04 -15.65z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 90.74,207.83 -27.06,373.1 -248.3,169.81 -535.21,131.55 -703.72,129.35 -260.71,-34.36 -477.24,-136.61 -651.23,-305.15 -107.99,-114.53 -166.71,-169.79 -251.14,-322.36 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 175.72,-134.34 282.22,-140.06 10.15,-0.52 12.4,3.33 4.69,7.93 -75.15,44.7 -192.31,45.47 -208.8,136.35 409.38,975.12 1821.99,714.85 1415.79,-33.51 -93.18,-171.66 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 434.15,376.28 628.32,452.39 788.06,308.84 733.75,-279.92 410.73,-857.24 -83.82,-150.6 -206.86,-291.38 -360.47,-424.51 -63.36,17.29 -88.91,89.33 -129.91,174.85 -0.41,0.86 -3.76,-0.58 -3.66,-1.09 12.23,-71.14 -21.94,-242.02 209.82,-244.82 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 147.44,-123.57 232.47,-128.26 0.99,-0.05 5.14,3.95 4.15,4.64 -66.48,49.89 -177.57,53.59 -167.23,149.16 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1310.4,972.81 812.12,1841.21 190.94,2196.64 -1116.24,638.68 -1912.35,-40.52 -2033.98,-646.82 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -59.79,127.31 -76.38,241.28 -1.58,10.85 -10.75,19.36 -13.93,4.82 -20.92,-95.68 -1.58,-244.3 56.79,-338.25 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 26,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M1797.28 2549.59l-110.52 -126.36 18.92 -16.54 110.52 126.36 -18.92 16.54zm26.47 35.84l15.51 -31.58 -24.44 21.38 -24.21 -72.2 33.36 -11.18 24.21 72.2 -24.44 21.38zm0 0l24.44 -21.38 13.41 39.98 -37.85 -18.6zm-60.59 -49.38l7.76 -15.79 68.35 33.59 -15.51 31.58 -68.35 -33.6 7.76 -15.78z',
        redBlood: 'M3062.84 1487.65l-107.45 -127.39 19.22 -16.21 107.45 127.39 -19.22 16.21zm25.82 36.3l16.09 -31.3 -24.83 20.95 -22.91 -72.63 33.55 -10.59 22.91 72.63 -24.82 20.94zm0 0l24.82 -20.94 12.69 40.22 -37.51 -19.28zm-59.69 -50.47l8.04 -15.64 67.74 34.82 -16.09 31.3 -67.74 -34.82 8.04 -15.65z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 48.15,129.97 43.3,301.46 -2.79,98.59 -14.34,135.19 -56.67,215.7 -87.42,113.18 -193.55,161.56 -240.96,160.02 -94.51,-3.08 -161.95,-12.72 -351.12,-89.62 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 130.02,319.09 12.21,484.36 -248.3,169.81 -567.94,131.55 -736.45,129.35 -260.71,-34.36 -483.78,-156.25 -657.77,-324.78 -107.99,-114.53 -166.71,-261.43 -251.14,-413.99 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 175.72,-134.34 282.22,-140.06 10.15,-0.52 12.4,3.33 4.69,7.93 -75.15,44.7 -192.31,45.47 -208.8,136.35 462.95,1013.38 1958.62,812.44 1415.79,-33.51 -105.5,-164.4 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 439.69,363.42 628.32,452.39 889.51,419.59 783.05,-226.1 410.73,-857.24 -83.82,-150.6 -206.86,-291.38 -360.47,-424.51 -63.36,17.29 -88.91,89.33 -129.91,174.85 -0.41,0.86 -3.76,-0.58 -3.66,-1.09 12.23,-71.14 -21.94,-242.02 209.82,-244.82 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 147.44,-123.57 232.47,-128.26 0.99,-0.05 5.14,3.95 4.15,4.64 -66.48,49.89 -177.57,53.59 -167.23,149.16 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1310.4,972.81 936.48,1860.86 315.3,2216.26 -1116.25,638.69 -2036.71,-60.14 -2158.35,-666.44 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -59.79,127.31 -76.38,241.28 -1.58,10.85 -10.75,19.36 -13.93,4.82 -20.92,-95.68 -1.58,-244.3 56.79,-338.25 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 27,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: 'M2118.99 2696.99l-148.96 -77.44 11.6 -22.3 148.96 77.44 -11.6 22.3zm37.7 23.73l2.95 -35.07 -14.97 28.81 -48.85 -58.42 26.99 -22.57 48.85 58.42 -14.97 28.82zm0 0l14.97 -28.82 27.05 32.36 -42.02 -3.53zm-74.42 -23.93l1.47 -17.53 75.89 6.39 -2.95 35.07 -75.89 -6.4 1.47 -17.52z',
        redBlood: 'M3160.79 1780.79l-75.78 -148.43 22.38 -11.44 75.78 148.43 -22.38 11.44zm16.92 41.2l22.76 -26.83 -28.92 14.76 -5.86 -75.92 35.08 -2.71 5.86 75.93 -28.91 14.77zm0 0l28.91 -14.77 3.25 42.05 -32.16 -27.28zm-46.71 -62.68l11.38 -13.42 58.09 49.27 -22.76 26.83 -58.09 -49.27 11.38 -13.42z',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 172.49,129.98 167.65,301.46 -2.78,98.58 18.38,239.91 -23.94,320.43 -87.42,113.18 -317.91,155 -365.32,153.47 -94.5,-3.07 -194.68,-110.9 -383.84,-187.79 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 130.02,319.09 12.21,484.36 -248.3,169.81 -567.94,131.55 -736.45,129.35 -260.71,-34.36 -483.78,-156.25 -657.77,-324.78 -107.99,-114.53 -166.71,-261.43 -251.14,-413.99 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 175.72,-134.34 282.22,-140.06 10.15,-0.52 12.4,3.33 4.69,7.93 -75.15,44.7 -192.31,45.47 -208.8,136.35 562.61,1068.75 2179.72,935.27 1415.79,-33.51 -120.94,-153.39 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 449.1,345.75 628.32,452.39 1054.86,627.78 959.58,-131.76 505.41,-855.77 -83.81,-150.59 -301.53,-292.84 -455.14,-425.97 -63.36,17.29 -88.91,89.33 -129.91,174.85 -0.41,0.86 -3.76,-0.58 -3.66,-1.09 12.23,-71.14 -21.94,-242.02 209.82,-244.82 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 147.44,-123.57 232.47,-128.26 0.99,-0.05 5.14,3.95 4.15,4.64 -66.48,49.89 -177.57,53.59 -167.23,149.16 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1166.41,763.37 1203.82,2001.56 541.66,2258.31 -1457.5,565.15 -2263.07,-102.19 -2384.71,-708.49 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -59.79,127.31 -76.38,241.28 -1.58,10.85 -10.75,19.36 -13.93,4.82 -20.92,-95.68 -1.58,-244.3 56.79,-338.25 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 28,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 172.49,129.98 167.65,301.46 -2.78,98.58 18.38,239.91 -23.94,320.43 -87.42,113.18 -317.91,155 -365.32,153.47 -94.5,-3.07 -194.68,-110.9 -383.84,-187.79 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 130.02,319.09 12.21,484.36 -248.3,169.81 -567.94,131.55 -736.45,129.35 -260.71,-34.36 -483.78,-156.25 -657.77,-324.78 -107.99,-114.53 -166.71,-261.43 -251.14,-413.99 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 166.1,-170.37 272.62,-176.06 10.14,-0.54 9.53,1.5 1.82,6.1 -75.13,44.7 -179.83,83.3 -196.32,174.18 562.61,1068.75 2179.72,935.27 1415.79,-33.51 -120.94,-153.39 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 449.1,345.75 628.32,452.39 1054.86,627.78 959.58,-131.76 505.41,-855.77 -83.81,-150.59 -301.53,-292.84 -455.14,-425.97 -63.36,17.29 -105.06,84.76 -146.03,170.29 -0.41,0.84 -6.45,-1.96 -6.35,-2.45 12.23,-71.15 -3.12,-236.1 228.64,-238.9 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 141.3,-145.49 226.34,-150.15 0.99,-0.05 3.25,3.56 2.26,4.26 -66.48,49.89 -169.54,75.85 -159.2,171.42 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1166.41,763.37 1203.82,2001.56 541.66,2258.31 -1457.5,565.15 -2263.07,-102.19 -2384.71,-708.49 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -100.07,134.89 -116.67,248.85 -1.57,10.85 -3.19,12.79 -6.36,-1.73 -20.9,-95.66 31.14,-245.32 89.52,-339.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 29,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 172.49,129.98 167.65,301.46 -2.78,98.58 18.38,239.91 -23.94,320.43 -87.42,113.18 -317.91,155 -365.32,153.47 -94.5,-3.07 -194.68,-110.9 -383.84,-187.79 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 130.02,319.09 12.21,484.36 -248.3,169.81 -567.94,131.55 -736.45,129.35 -260.71,-34.36 -483.78,-156.25 -657.77,-324.78 -107.99,-114.53 -166.71,-261.43 -251.14,-413.99 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 166.1,-170.37 272.62,-176.06 10.14,-0.54 9.53,1.5 1.82,6.1 -75.13,44.7 -179.83,83.3 -196.32,174.18 562.61,1068.75 2179.72,935.27 1415.79,-33.51 -120.94,-153.39 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 449.1,345.75 628.32,452.39 1054.86,627.78 959.58,-131.76 505.41,-855.77 -83.81,-150.59 -301.53,-292.84 -455.14,-425.97 -63.36,17.29 -105.06,84.76 -146.03,170.29 -0.41,0.84 -6.45,-1.96 -6.35,-2.45 12.23,-71.15 -3.12,-236.1 228.64,-238.9 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 141.3,-145.49 226.34,-150.15 0.99,-0.05 3.25,3.56 2.26,4.26 -66.48,49.89 -169.54,75.85 -159.2,171.42 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1166.41,763.37 1203.82,2001.56 541.66,2258.31 -1457.5,565.15 -2263.07,-102.19 -2384.71,-708.49 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -100.07,134.89 -116.67,248.85 -1.57,10.85 -3.19,12.79 -6.36,-1.73 -20.9,-95.66 31.14,-245.32 89.52,-339.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 30,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 172.49,129.98 167.65,301.46 -2.78,98.58 18.38,239.91 -23.94,320.43 -87.42,113.18 -317.91,155 -365.32,153.47 -94.5,-3.07 -194.68,-110.9 -383.84,-187.79 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 130.02,319.09 12.21,484.36 -248.3,169.81 -567.94,131.55 -736.45,129.35 -260.71,-34.36 -483.78,-156.25 -657.77,-324.78 -107.99,-114.53 -166.71,-261.43 -251.14,-413.99 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 166.1,-170.37 272.62,-176.06 10.14,-0.54 9.53,1.5 1.82,6.1 -75.13,44.7 -179.83,83.3 -196.32,174.18 562.61,1068.75 2179.72,935.27 1415.79,-33.51 -120.94,-153.39 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 449.1,345.75 628.32,452.39 1054.86,627.78 959.58,-131.76 505.41,-855.77 -83.81,-150.59 -301.53,-292.84 -455.14,-425.97 -63.36,17.29 -105.06,84.76 -146.03,170.29 -0.41,0.84 -6.45,-1.96 -6.35,-2.45 12.23,-71.15 -3.12,-236.1 228.64,-238.9 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 141.3,-145.49 226.34,-150.15 0.99,-0.05 3.25,3.56 2.26,4.26 -66.48,49.89 -169.54,75.85 -159.2,171.42 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1166.41,763.37 1203.82,2001.56 541.66,2258.31 -1457.5,565.15 -2263.07,-102.19 -2384.71,-708.49 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -100.07,134.89 -116.67,248.85 -1.57,10.85 -3.19,12.79 -6.36,-1.73 -20.9,-95.66 31.14,-245.32 89.52,-339.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 31,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 172.49,129.98 167.65,301.46 -2.78,98.58 18.38,239.91 -23.94,320.43 -87.42,113.18 -317.91,155 -365.32,153.47 -94.5,-3.07 -194.68,-110.9 -383.84,-187.79 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 130.02,319.09 12.21,484.36 -248.3,169.81 -567.94,131.55 -736.45,129.35 -260.71,-34.36 -483.78,-156.25 -657.77,-324.78 -107.99,-114.53 -166.71,-261.43 -251.14,-413.99 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 166.1,-170.37 272.62,-176.06 10.14,-0.54 9.53,1.5 1.82,6.1 -75.13,44.7 -179.83,83.3 -196.32,174.18 562.61,1068.75 2179.72,935.27 1415.79,-33.51 -120.94,-153.39 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 449.1,345.75 628.32,452.39 1054.86,627.78 959.58,-131.76 505.41,-855.77 -83.81,-150.59 -301.53,-292.84 -455.14,-425.97 -63.36,17.29 -105.06,84.76 -146.03,170.29 -0.41,0.84 -6.45,-1.96 -6.35,-2.45 12.23,-71.15 -3.12,-236.1 228.64,-238.9 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 141.3,-145.49 226.34,-150.15 0.99,-0.05 3.25,3.56 2.26,4.26 -66.48,49.89 -169.54,75.85 -159.2,171.42 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1166.41,763.37 1203.82,2001.56 541.66,2258.31 -1457.5,565.15 -2263.07,-102.19 -2384.71,-708.49 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -100.07,134.89 -116.67,248.85 -1.57,10.85 -3.19,12.79 -6.36,-1.73 -20.9,-95.66 31.14,-245.32 89.52,-339.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      },
      {
        id: 32,
        phase: 9,
        title: "Ранняя диастола желудочков",
        description: "<p>1. Заполнение кровью желудочков при расслаблении </p>",
        showSA: 0,
        showAV: 0,
        blueBloodBottom: '',
        blueBloodTop: '',
        redBlood: '',
        redHeart: 'M962.31 204.78c20.32,-53.62 73.42,-113.82 134.6,-146.12 54.36,-28.69 62.67,-60.25 191.89,-53.56 258.6,364.67 267.03,537.13 629.21,889.93 81.15,70.88 166.93,124.39 221.94,194.77 76.4,97.74 86.14,23.16 31.92,-15.45 -109.63,-78.07 -147.55,-204.19 -160.05,-274.92 -1.96,-119.03 -1.3,-224.05 50.72,-290.71 52.66,-67.47 160.16,-121.9 240.66,-151.76 392.05,-17.1 602.06,-12.35 839.33,147.94 68.01,64.45 87.18,104.27 97.4,190.17 1.72,14.55 4.8,100.2 2.98,115.91 -7.8,67.09 -43.64,186.54 -85.55,238.23 -81.26,28.36 -113.5,-20.31 -194.77,88.22 45.2,-22.66 66.65,-85.32 120.96,-53.26 47.42,27.99 138.43,103.41 184.72,150.12 97.14,98.01 181.15,186.77 243.78,280.34 86.86,129.77 142.12,195.55 217.85,377.78 33.7,128.41 172.49,129.98 167.65,301.46 -2.78,98.58 18.38,239.91 -23.94,320.43 -87.42,113.18 -317.91,155 -365.32,153.47 -94.5,-3.07 -194.68,-110.9 -383.84,-187.79 -153.04,-58.95 -190.67,-104.06 -301.12,-177.68 -164.33,-109.53 -354.92,-240.14 -478.39,-366.08 19.64,-32.18 134.06,-10.6 166.78,-147.5 -45.38,64.18 -176.29,124.17 -237.11,73.87 -105.26,-106.29 -218.26,-222.27 -323.81,-319.02 -411.74,-377.42 -491.65,-425.77 -781.24,-923.38l-207.24 -415.4z',
        blueHeart: 'M912.67 1425.51c-3.28,-181.07 -15.98,-413.55 -19.25,-594.63 51.79,-37.19 116.69,-61.31 179.9,-62.48 52.37,-0.97 119.51,9.48 160.44,51.03 0,103.63 7.89,294.25 7.89,397.87 84.38,-18.88 110.89,-21.3 192.53,12.82 66.97,35.86 127.49,110.26 165.75,174.65 63.33,106.58 117.83,416.3 111.21,637.88 -1.99,66.79 -60.81,123.7 -63.36,167.89 -0.66,11.65 76.25,-132.04 78.07,-121.72 -1.89,-17.67 135.64,-37.51 118.67,-43.64 -20.28,-7.32 -113.75,7.84 -117.51,-22.3 -70.76,-567.43 -142.22,-1326.25 -200.38,-1871.02 20.67,-120.94 134.63,-133.88 197.84,-140.29 90.03,-6.13 173.76,24.98 216.13,110.83 56.87,608.99 126.86,1180.37 227.9,1741.9 2.17,1.86 -10.51,47.79 -36.17,78.08 -27.06,31.95 -67.21,48.39 -64.94,50.32 40.69,34.38 91.69,-87.67 137.18,-58.86 281.87,178.49 627.5,428.84 788.32,767.15 39.27,83.45 130.02,319.09 12.21,484.36 -248.3,169.81 -567.94,131.55 -736.45,129.35 -260.71,-34.36 -483.78,-156.25 -657.77,-324.78 -107.99,-114.53 -166.71,-261.43 -251.14,-413.99 -3.79,-8.9 88.35,-125.11 81.21,-131.53 -13.11,-11.81 -52.43,67.15 -106.92,120.25 -27.22,26.53 -77.13,-3.66 -89.76,6.45 -11.83,303.56 1.32,422.03 4.21,678.15 -79.97,71.88 -269.6,48.84 -355.06,9.82 -6.77,-249.07 2.82,-512.87 -3.95,-761.93 -67.83,-59.96 -120.97,-101.95 -162.58,-188.06 -47.53,-98.34 -42.65,-201.16 -24.78,-386.27 59.63,-290.49 92.88,-339.9 210.57,-497.3z',
        greyHeart: 'M1320.06 2558.86c30.83,-120.8 166.1,-170.37 272.62,-176.06 10.14,-0.54 9.53,1.5 1.82,6.1 -75.13,44.7 -179.83,83.3 -196.32,174.18 562.61,1068.75 2179.72,935.27 1415.79,-33.51 -120.94,-153.39 -318.35,-318.35 -636.71,-569.68 -74.07,59.88 -144.91,36.19 -213.02,-8.78 -9.8,-6.46 -5.46,-9.76 6.27,-7.1 72.74,16.42 154.02,-0.84 189.01,-48.01l-23.89 -221.16 151.82 177.7c127.21,12.52 202.78,-56.12 262.38,-141.67 0.29,-0.43 7.46,0.33 7.26,1.6 -13.45,84.34 -57.79,167.05 -178.79,205.54 257.62,190.3 449.1,345.75 628.32,452.39 1054.86,627.78 959.58,-131.76 505.41,-855.77 -83.81,-150.59 -301.53,-292.84 -455.14,-425.97 -63.36,17.29 -105.06,84.76 -146.03,170.29 -0.41,0.84 -6.45,-1.96 -6.35,-2.45 12.23,-71.15 -3.12,-236.1 228.64,-238.9 84.56,-200.78 141.56,-414.83 -93.01,-532.1 -546.32,-273.14 -1192.46,-67.91 -946.65,477.5 58.19,129.13 511.02,452.39 578.02,452.39 28.12,-101.78 141.3,-145.49 226.34,-150.15 0.99,-0.05 3.25,3.56 2.26,4.26 -66.48,49.89 -169.54,75.85 -159.2,171.42 41.17,243.89 -145.49,235.41 -153.74,230.95 2.54,-11.93 240.19,-93.43 -41.77,-267.06 -101.02,-41.86 -159.74,-93.79 -216.83,-133.19 -151.52,-104.6 -207.38,-178.44 -292.56,-275.79 -19.14,-108.57 -35.41,-219.56 -45.97,-386.4 31.94,-100.08 62,-118.55 136.97,-174.21 295.53,-219.48 1105.44,-116.28 1141.54,300.78 7.93,91.49 -22.76,197.46 -102.75,319.16 1166.41,763.37 1203.82,2001.56 541.66,2258.31 -1457.5,565.15 -2263.07,-102.19 -2384.71,-708.49 -569.66,67.02 -824.4,-389.59 -527.78,-1022.04 258.51,-551.21 949.65,-644.84 938.29,427.24 68.31,34.24 122.79,-3.24 180,-54.6 6.57,-5.91 13.33,-3.55 8.49,4.64 -44.5,75.21 -109.36,134.58 -188.49,158.86 -54.15,37.48 -100.07,134.89 -116.67,248.85 -1.57,10.85 -3.19,12.79 -6.36,-1.73 -20.9,-95.66 31.14,-245.32 89.52,-339.27 0,-209.43 -52.43,-434.28 -92.15,-561.29 -79.27,-253.54 -325.3,-303.38 -533.1,-173.3 -312.69,195.71 -541.08,989.37 -128.72,1212.12 97.44,52.63 231.87,54.43 374.27,54.43z'
      }
    ];

    $_.$svg.ionRangeSlider({
      skin: "round",
      values: [
        "Pн – Pк", "Pн – Pк", "Pн – Pк", "Pн – Pк",
        "Pк – Q", "Pк – Q",
        "Q – R", "Q – R",
        "R – S", "R – S",
        "S – L", "S – L",
        "L – j", "L – j",
        "j – Tн", "j – Tн",
        "Тн – Тк", "Тн – Тк", "Тн – Тк", "Тн – Тк",
        "Тк – Uн", "Тк – Uн",
        "Uн – Uк", "Uн – Uк", "Uн – Uк", "Uн – Uк",
        "Uк – Pн", "Uк – Pн", "Uк – Pн", "Uк – Pн", "Uк – Pн", "Uк – Pн", "Uк – Pн"
      ],
      from: 0,
      min: 0,
      max: 32,
      hide_min_max: true,
      onStart: function () {
        $_.changePhase(ecgPhases[0], ecg, heart);
      },

      onChange: function (data) {
        $_.changePhase(ecgPhases[data.from], ecg, heart);
        ecg.select('.js-green-line').attr({
          "x1": data.from * 590 + 757,
          "x2": data.from * 590 + 757
        });

      }
    });
  }
};


$(document).ready(function () {
  $_.init();
});


},{}]},{},[3]);
