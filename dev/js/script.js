var $_ = {
    init: function () {
        this.initCache();
        this.initForms();
        this.scrollToTop();
        this.animatedScroll();
        this.drawSvg();

    },
    initCache: function () {
        this.$document = $(window);
        this.$html = $('html, body');
        this.$slider = $('.js-slider-banner');
        this.$scrollToTop = $('.js-scroll-to-top');


        this.$phaseTitle = $('.js-phase-title');
        this.$table = $('.js-table');

        this.$svg = $('.js-ecg-range');

        this.$number = $('.js-number');
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
    changePhase: function(data, ecg) {
        $_.$phaseTitle.html(data.title);
        $_.$table.html(data.table);
        $_.$number.html(data.id);
        for (var i = 1; i <= 10; i++) {
            var phase = '.js-phase'.concat(i);
            ecg.select(phase).opacity(0);
        }
        ecg.select('.js-phase'.concat(data.phase)).opacity(1)


    },
    drawSvg: function () {
        var ecg = SVG("ecg-svg");
        var ecgPhases = [
            {
                id: 0,
                phase: 1,
                title: "Систола предсердий",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td>Признаки перикардита</td><td>Снижение кровенаполнения коронарных артерий</td></tr> <tr><td>ЭКГ признаки</td><td>Изменение амплитуды Р-Q фазы при ортопробе</td><td>Несколько Р волн</td></tr> <tr><td>Возможные последствия</td><td>Снижение двигательной активности, возможные внезапные короткие головокружения</td><td>Предынфарктное состояние. Развитый кардиосклероз</td></tr> <tr><td>Рекомендации</td><td><p>1. Комплексное лечение направленное на нормализацию кислотно – щелочного баланса организма</p><p>2. Сбалансированное питание</p><p>3. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>4. Регулярные физические занятия</p></td><td><p>1. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>2. Настойка «Гинкготропил», «Нуксен 6»</p><p>3. Дыхательный тренажёр</p><p>4. Иглотерапия</p><p>5. L – карнитин, «Мексикор», хвойный (кедровый) бальзам</p></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 1,
                phase: 1,
                title: "Систола предсердий",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td>Признаки перикардита</td><td>Снижение кровенаполнения коронарных артерий</td></tr> <tr><td>ЭКГ признаки</td><td>Изменение амплитуды Р-Q фазы при ортопробе</td><td>Несколько Р волн</td></tr> <tr><td>Возможные последствия</td><td>Снижение двигательной активности, возможные внезапные короткие головокружения</td><td>Предынфарктное состояние. Развитый кардиосклероз</td></tr> <tr><td>Рекомендации</td><td><p>1. Комплексное лечение направленное на нормализацию кислотно – щелочного баланса организма</p><p>2. Сбалансированное питание</p><p>3. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>4. Регулярные физические занятия</p></td><td><p>1. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>2. Настойка «Гинкготропил», «Нуксен 6»</p><p>3. Дыхательный тренажёр</p><p>4. Иглотерапия</p><p>5. L – карнитин, «Мексикор», хвойный (кедровый) бальзам</p></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 2,
                phase: 1,
                title: "Систола предсердий",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td>Признаки перикардита</td><td>Снижение кровенаполнения коронарных артерий</td></tr> <tr><td>ЭКГ признаки</td><td>Изменение амплитуды Р-Q фазы при ортопробе</td><td>Несколько Р волн</td></tr> <tr><td>Возможные последствия</td><td>Снижение двигательной активности, возможные внезапные короткие головокружения</td><td>Предынфарктное состояние. Развитый кардиосклероз</td></tr> <tr><td>Рекомендации</td><td><p>1. Комплексное лечение направленное на нормализацию кислотно – щелочного баланса организма</p><p>2. Сбалансированное питание</p><p>3. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>4. Регулярные физические занятия</p></td><td><p>1. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>2. Настойка «Гинкготропил», «Нуксен 6»</p><p>3. Дыхательный тренажёр</p><p>4. Иглотерапия</p><p>5. L – карнитин, «Мексикор», хвойный (кедровый) бальзам</p></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 3,
                phase: 1,
                title: "Систола предсердий",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td>Признаки перикардита</td><td>Снижение кровенаполнения коронарных артерий</td></tr> <tr><td>ЭКГ признаки</td><td>Изменение амплитуды Р-Q фазы при ортопробе</td><td>Несколько Р волн</td></tr> <tr><td>Возможные последствия</td><td>Снижение двигательной активности, возможные внезапные короткие головокружения</td><td>Предынфарктное состояние. Развитый кардиосклероз</td></tr> <tr><td>Рекомендации</td><td><p>1. Комплексное лечение направленное на нормализацию кислотно – щелочного баланса организма</p><p>2. Сбалансированное питание</p><p>3. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>4. Регулярные физические занятия</p></td><td><p>1. Волновая – резонансная терапия прибором «ЭЖ-2»</p><p>2. Настойка «Гинкготропил», «Нуксен 6»</p><p>3. Дыхательный тренажёр</p><p>4. Иглотерапия</p><p>5. L – карнитин, «Мексикор», хвойный (кедровый) бальзам</p></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 4,
                phase: 2,
                title: "Закрытие предсердно-желудочковых клапанов",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td>Признаки эндокардита</td></tr> <tr><td>ЭКГ признаки</td><td>Изменение амплитуды Р-Q фазы при ортопробе</td></tr> <tr><td>Возможные последствия</td><td>Снижение двигательной активности, возможные внезапные короткие головокружения</td></tr> <tr><td>Рекомендации</td><td>Настойка «Юглон», «9-ка СТОПразит», «Нуксен 2» (чёрный орех), пить два курса</td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 5,
                phase: 2,
                title: "Закрытие предсердно-желудочковых клапанов",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td>Признаки эндокардита</td></tr> <tr><td>ЭКГ признаки</td><td>Изменение амплитуды Р-Q фазы при ортопробе</td></tr> <tr><td>Возможные последствия</td><td>Снижение двигательной активности, возможные внезапные короткие головокружения</td></tr> <tr><td>Рекомендации</td><td>Настойка «Юглон», «9-ка СТОПразит», «Нуксен 2» (чёрный орех), пить два курса</td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 6,
                phase: 3,
                title: "Сокращение межжелудочковой перегородки",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 7,
                phase: 3,
                title: "Сокращение межжелудочковой перегородки",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 8,
                phase: 4,
                title: "Сокращение стенок желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 9,
                phase: 4,
                title: "Сокращение стенок желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 10,
                phase: 5,
                title: "Напряжение мышц сердца",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 11,
                phase: 5,
                title: "Напряжение мышц сердца",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 12,
                phase: 6,
                title: "Открытие клапанов и быстрое изгнание крови",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 13,
                phase: 6,
                title: "Открытие клапанов и быстрое изгнание крови",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 14,
                phase: 7,
                title: "Медленное изгнание крови",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 15,
                phase: 7,
                title: "Медленное изгнание крови",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 16,
                phase: 8,
                title: "Создание максимального систолического давления в аорте",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 17,
                phase: 8,
                title: "Создание максимального систолического давления в аорте",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 18,
                phase: 8,
                title: "Создание максимального систолического давления в аорте",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 19,
                phase: 8,
                title: "Создание максимального систолического давления в аорте",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 20,
                phase: 9,
                title: "Закрытие полулунных клапанов",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 21,
                phase: 9,
                title: "Закрытие полулунных клапанов",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 22,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 23,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 24,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 25,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 26,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 27,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 28,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 29,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 30,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 31,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
            },
            {
                id: 31,
                phase: 9,
                title: "Ранняя диастола желудочков",
                path: "",
                table: "<tr><td>Выявляемые физиологические, функциональные, метаболические и другие изменения</td><td></td></tr> <tr><td>ЭКГ признаки</td><td></td></tr> <tr><td>Возможные последствия</td><td></td></tr> <tr><td>Рекомендации</td><td></td></tr>",
                showAV: false,
                showNode2: false,
                showNode3: false
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
                // $_.changePhase(ecgPhases[0], ecg);
            },

            onChange: function (data) {
                $_.changePhase(ecgPhases[data.from], ecg);
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

