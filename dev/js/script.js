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


        this.$phaseTitle = $('.js-phase-title');
        this.$deviations = $('.js-deviations');
        this.$symptoms = $('.js-symptoms');
        this.$aftermath = $('.js-aftermath');
        this.$todo = $('.js-todo');

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
    changePhase: function(data) {
        $_.$phaseTitle.html(data.title);
        $_.$deviations.html(data.deviations);
        $_.$symptoms.html(data.symptoms);
        $_.$aftermath.html(data.aftermath);
        $_.$todo.html(data.todo);

    },
    drawSvg: function () {
        var ecg = SVG("ecg-svg");
        // var heart = draw.select('.svg__heart');
        // var phases = [
        //     'Систола предсердий',
        //     'Закрытие предсердно-желудочковых клапанов',
        //     'Сокращение межжелудочковой перегородки',
        //     'Сокращение стенок желудочков',
        //     'Напряжение мышц сердца',
        //     'Открытие клпанов и быстрое изгнание крови',
        //     'Медленное изгнание крови',
        //     'Создание максимального систолического давления в аорте',
        //     'Закрытие полулунных клапанов',
        //     'Ранняя диастола желудочков'
        // ];
        var ecgPhases = [
            {
                id: 0,
                title: "Систола предсердий",
                path: "",
                deviations: "Признаки перикардита",
                symptoms: "Увеличенная амплитуда Р волны. Возможно снижение амплитуды R зубца ниже изолинии при ортопробе",
                aftermath: "Отдышка при нагрузке",
                todo: "Настойка «Юглон», «9-ка СТОПразит», «Нуксен 2» (чёрный орех), пить два курса",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 1,
                title: "Систола предсердий",
                path: "",
                deviations: "Признаки эндокардита",
                symptoms: "Изменение амплитуды Р-Q фазы при ортопробе",
                aftermath: "Снижение двигательной активности, возможные внезапные короткие головокружения",
                todo: "1.Комплексное лечение направленное на нормализацию кислотно – щелочного баланса организма. 2.Сбалансированное питание. 3.Волновая – резонансная терапия прибором «ЭЖ-2». 4.Регулярные физические занятия.",
                showAV: false,
                showNode2: false,
                showNode3: false
            },

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
            onStart: function (data) {
                // $_.turnOnPhases(ecg, 0, data.from);
                $_.$phaseTitle.innerHTML = 111;
            },

            onChange: function (data) {
                $_.changePhase(ecgPhases[data.from]);
                ecg.select('.js-green-line').animate(40, '>', 0).attr({
                    "x1": data.from * 590 + 757,
                    "x2": data.from * 590 + 757
                });
                //draw.select('#pq-lines line').attr("stroke", "#000").attr("opacity", "1");
                //heart.animate(100, '>', 0).plot(heartStates[data.from])
                // $_.togglePhases(ecg, data);






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

