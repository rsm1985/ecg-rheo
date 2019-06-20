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