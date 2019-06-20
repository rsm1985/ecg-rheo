var $_ = {
    init: function() {
        this.initCache();
        this.initForms();
        this.scrollToTop();
        // this.slickSlider();
        this.animatedScroll();
        this.drawSvg();

    },
    initCache: function() {
        this.$document = $(window);
        this.$html = $('html, body');
        this.$slider = $('.js-slider-banner');
        this.$scrollTo = $('.js-scroll-to-element');
        this.$scrollToTop = $('.js-scroll-to-top');

        this.$svg = $('.js-ecg-range');



    },
    initForms: function () {
        form_adjuster.init({
            'file': false,
            'success': function () {
                var $form = $(form_adjuster.$form_cur),
                    $inputs = $form.find('input,textarea');

                if ($('.js-popup').hasClass('_active')) {
                    $('.js-popup._active').removeClass('_active');
                }
                else {
                    $('.js-overlay').addClass('_active');
                }

                $('.js-popup-thx').addClass('_active');


                setTimeout(function () {
                    $form.trigger('reset');
                    $inputs.removeClass('valid error active _active');


                }, 500);

                setTimeout(function () {
                    if ($('.js-popup').hasClass('_active')) {
                        $('.js-popup,.js-overlay').removeClass('_active');
                    }
                }, 4000)
            }
        });
    },

    scrollToTop: function () {

        $_.$scrollToTop.on('click', function(){

            $_.$html.animate({scrollTop: 0}, 1000);
        });
    },
    slickSlider: function () {
        $_.$slider.slick({
            arrows: true,
            dots: true
        });
    },
    animatedScroll: function () {
        $_.$document.on('scroll', function(){
            if($(window).scrollTop() > $_.$document.innerHeight()) {
                $_.$scrollToTop.addClass('show');
            }
            else {
                $_.$scrollToTop.removeClass('show');
            }

        });

        $_.$scrollTo.on('click', function () {

            var $headerHeight = $('.js-header').innerHeight(),
                $dataAttr = $(this).attr('data-link'),
                $link = '.' + $dataAttr;

            $($link).animatescroll({
                // padding: $headerHeight
            });
        });
    },
    drawSvg: function() {
        var draw = SVG("ecg-svg");
        // var heart = draw.select('.svg__heart');
        var heartStates = [
            {
                phase: "P-Q",
                path: ""
            }

        ];
        $_.$svg.ionRangeSlider({
            skin: "round",
            values: [
                "P-Q", "P-Q", "P-Q", "Q-R", "May", "Jun",
                "P-Q", "P-Q", "P-Q", "Q-R", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ],
            from: 0,
            min: 0,
            max: 49,
            hide_min_max: true,
            onStart: function(){
                // draw.select('#pq-lines line').attr("stroke", "#000");


            },
            onChange: function (data) {
                //console.log(data.from);
                draw.select('.js-green-line').attr({
                    "x1": data.from*100+390,
                    "x2": data.from*100+390
                });
                data.from = 1;
                //draw.select('#pq-lines line').attr("stroke", "#000").attr("opacity", "1");
                //heart.animate(100, '>', 0).plot(heartStates[data.from])
                if ((data.from > 0) && (data.from <= 100)) {

                    //draw.select('#pq-lines line').attr("stroke", "#dd0000");

                }
                // if ((data.from > 10) && (data.from < 20)) {
                //     heart.animate(100, '>', 0).plot('M33676.96 5098.86c1376.87,-310.89 3040.93,-124.15 4375.41,289.54 832.82,258.17 2815.03,4204.62 2815.03,5493.4 0,2076.7 603.17,4491.93 -2594.28,4517.79 -1186.52,9.59 -3248.64,-1482.59 -3949.26,-2583.78 -1302.74,-2047.6 -3945.7,-6607.83 -646.9,-4716.95z')
                // }
            }
        });
    }
};


$(document).ready(function() {
    $_.init();
});

