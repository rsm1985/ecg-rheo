var $_ = {
    init: function () {
        this.initCache();
        this.initForms();
        this.scrollToTop();
        // this.slickSlider();
        this.animatedScroll();
        this.drawSvg();

    },
    initCache: function () {
        this.$document = $(window);
        this.$html = $('html, body');
        this.$slider = $('.js-slider-banner');
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
                } else {
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

        $_.$scrollToTop.on('click', function () {

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
        $_.$document.on('scroll', function () {
            if ($(window).scrollTop() > $_.$document.innerHeight()) {
                $_.$scrollToTop.addClass('show');
            } else {
                $_.$scrollToTop.removeClass('show');
            }

        });
    },
    switchOnPhase: function() {

    },
    turnOnPhases: function(ecg, phase) {
        var phases = ['#ps-pf', '#pf-q', '#q-r', '#r-s', '#s-l', '#l-j', '#j-ts', '#ts-tf', '#tf-us', '#us-uf', '#uf-ps'];
        for( var i = 0; i < 11; i++) {
            ecg.select(phases[i]).attr("opacity", "0");
            if(i === phase) {
                ecg.select(phases[i]).attr("opacity", "1");
            }
        }



    },
    togglePhases: function (ecg, data) {
        switch(data.from_value) {
            case 'Pн-Pк': {
                $_.turnOnPhases(ecg, 0);
                break;
            }
            case 'Pк-Q': {
                $_.turnOnPhases(ecg, 1);
                break;
            }
            case 'Q-R': {
                $_.turnOnPhases(ecg, 2);
                break;
            }
            case 'R-S': {
                $_.turnOnPhases(ecg, 3);
                break;
            }
            case 'S-L': {
                $_.turnOnPhases(ecg, 4);
                break;
            }
            case 'L-j': {
                $_.turnOnPhases(ecg, 5);
                break;
            }
            case 'j-Tн': {
                $_.turnOnPhases(ecg, 6);
                break;
            }
            case 'Тн-Тк': {
                $_.turnOnPhases(ecg, 7);
                break;
            }
            case 'Тк-Uн': {
                $_.turnOnPhases(ecg, 8);
                break;
            }
            case 'Uн-Uк': {
                $_.turnOnPhases(ecg, 9);
                break;
            }
            case 'Uк-Pн': {
                $_.turnOnPhases(ecg, 10);
                break;
            }
            default: break;

        }


    },
    drawSvg: function () {
        var ecg = SVG("ecg-svg");
        // var heart = draw.select('.svg__heart');
        var ecgStates = [
            {
                phase: "Pн-Pк",
                path: ""
            }

        ];
        $_.$svg.ionRangeSlider({
            skin: "round",
            values: [
                "Pн-Pк", "Pн-Pк", "Pн-Pк", "Pн-Pк",
                "Pк-Q", "Pк-Q",
                "Q-R", "Q-R",
                "R-S", "R-S",
                "S-L", "S-L",
                "L-j", "L-j",
                "j-Tн", "j-Tн",
                "Тн-Тк", "Тн-Тк", "Тн-Тк", "Тн-Тк",
                "Тк-Uн", "Тк-Uн",
                "Uн-Uк", "Uн-Uк", "Uн-Uк", "Uн-Uк",
                "Uк-Pн", "Uк-Pн", "Uк-Pн", "Uк-Pн", "Uк-Pн", "Uк-Pн", "Uк-Pн"
            ],
            from: 0,
            min: 0,
            max: 32,
            hide_min_max: true,
            onStart: function () {
                $_.turnOnPhases(ecg, 0);
            },

            onChange: function (data) {
                // console.log(data.from);
                ecg.select('.js-green-line').animate(40, '>', 0).attr({
                    "x1": data.from * 590 + 755,
                    "x2": data.from * 590 + 755
                });

                // console.log(data.from_value);
                //data.from = 1;
                //draw.select('#pq-lines line').attr("stroke", "#000").attr("opacity", "1");
                //heart.animate(100, '>', 0).plot(heartStates[data.from])
                $_.togglePhases(ecg, data);






                // if ((data.from > 10) && (data.from < 20)) {
                //     heart.animate(100, '>', 0).plot('M33676.96 5098.86c1376.87,-310.89 3040.93,-124.15 4375.41,289.54 832.82,258.17 2815.03,4204.62 2815.03,5493.4 0,2076.7 603.17,4491.93 -2594.28,4517.79 -1186.52,9.59 -3248.64,-1482.59 -3949.26,-2583.78 -1302.74,-2047.6 -3945.7,-6607.83 -646.9,-4716.95z')
                // }
            }
        });
    }
};


$(document).ready(function () {
    $_.init();
});

