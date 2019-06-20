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