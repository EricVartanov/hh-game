'use strict'
let docWidth = document.documentElement.clientWidth

/* Function Block Scroll */
var blockScroll = function (state) {
    if (state == "open") {
        setTimeout(function () {

            if (!document.body.hasAttribute('data-body-scroll-fix')) {

                let scrollPosition = window.pageYOffset || document.documentElement.scrollTop; // Получаем позицию прокрутки

                document.body.setAttribute('data-body-scroll-fix', scrollPosition); // Cтавим атрибут со значением прокрутки
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.top = '-' + scrollPosition + 'px';
                document.body.style.left = '0';
                document.body.style.right = '0';
                if ($('body').height() < $(window).height()) {
                    /*  console.log('меньше') */
                    document.body.style.bottom = '0';
                }
            }

        }, 10);
    }
    if (state == "close") {
        if (document.body.hasAttribute('data-body-scroll-fix')) {

            let scrollPosition = document.body.getAttribute('data-body-scroll-fix'); // Получаем позицию прокрутки из атрибута

            document.body.removeAttribute('data-body-scroll-fix'); // Удаляем атрибут
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';

            window.scroll(0, scrollPosition); // Прокручиваем на полученное из атрибута значение

        }
    }
}
//----------------------//

// Реиницилизация размера bg с паралаксом 
let bgWrapper = function () {
    if (docWidth >= 1200) {
        $('.idc-parralax-wrapper').css({
            'width': document.documentElement.clientWidth + 'px',
            'height': $('.idc-container').innerHeight() + 'px',
        })
    }
    else return false
}
//----------------------//

// Инициалищация AOS анимации //
let InitAos = function () {
    if ($('[data-aos]').length) {
        AOS.init({
            once: true,
        });
    }
    if ($('body[data-aos-easing]').length) {
        AOS.refresh()
    }
}
//----------------------//

// Иницализация написания текста //
let InitTyped = function () {
    if ($('#idc-typed').length) {
        let typedTextElem = $('#idc-typed'),
            typedText = typedTextElem.html()
        typedTextElem.html('')
        let typed = new Typed('#idc-typed', { // Тут id того блока, в которм будет анимация
            strings: [
                typedText
            ],
            showCursor: false,
            autoInsertCss: false,
            onComplete: function (self) {
                let cursor = '<span class="idc-animation-cursor"></span>'
                $(cursor).appendTo($(self.el))
            },
            typeSpeed: 20, // Скорость печати
            startDelay: 0, // Задержка перед стартом анимации
            backSpeed: 0, // Скорость удаления
            loop: false // Указываем, повторять ли анимацию
        });
    } else return false
}
//----------------------//

// Document ready //
jQuery(document).ready(function ($) {

    $(window).trigger('resize')
    bgWrapper()
    InitAos()
    InitTyped()
    // Инициализация галереи
    InitGallery()
    // ---------------------------------- //

    // Инициализация gragula
    InitDragula()

    // функция открытия/закрытия модального окна 
    $('main').on('click', '.modal-open, .modal-close', function (e) {
        e.preventDefault()
        var thisHash
        if ($(this).hasClass('modal-open'))
            thisHash = '#' + $(this).attr('data-modal')
        else {
            thisHash = $('.idc-modal_open')
        }
        $(thisHash).toggleClass('idc-modal_open')
        if ($(thisHash).hasClass('idc-modal-answer')) {
            var NowIndex = $(this).closest('.idc-answer').index() + 1,
                ModalImg = $(thisHash).find('.idc-modal-answer__img > img')
        }
        if ($(thisHash).hasClass('idc-modal_open')) {
            blockScroll('open')
            if ($(thisHash).hasClass('idc-modal-answer')) {
                ModalImg.attr('src', ModalImg.attr('data-src-' + NowIndex + ''))
            }
        } else {
            blockScroll('close')
            if ($(thisHash).hasClass('idc-modal-answer')) {
                ModalImg.attr('src', '')
            }
            // Пауза при закрытии видео //
            if ($(thisHash).find('iframe')) {
                $(thisHash).find('iframe').each(function () {
                    $(this)[0].contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
                });
            }
        };
    })
    // ------------------------ //

    // Записываем начальньные значения текущего шага и правильного ответа //
    var StepNumber = 1,
        rightAnswer = 0
    // ------------------------ //

    // Обработчик изменения radio на каждом шаге
    $('main').on('change', '.idc-answer__radio, .idc-answer__checkbox', function (e) {
        var $this = $(this),
            $thisQuestionBlock = $this.closest('.idc__qestion-block')
        if ($(this).hasClass('idc-answer__radio')) {
            var otherRadio = $thisQuestionBlock.find('.idc-answer__radio'),
                AnswerMain = $this.closest('.idc-answer')
            // console.log(AnswerMain)
            StepNumber = EditAnswer(AnswerMain, $thisQuestionBlock, StepNumber)
            // console.log(StepNumber)
            otherRadio.each(function (index, item) {
                $(item).attr('disabled', true)
            })
            $this.closest('.idc__qestion-block').find('.idc-button.idc-button_disabled').removeClass('idc-button_disabled').addClass('idc-button_enabled')

        } else {
            $thisQuestionBlock.find('.idc-button_disabled').removeClass('idc-button_disabled').addClass('idc-button_enabled')
        }
        e.preventDefault()
        setTimeout(function () {
            bgWrapper()
        }, 300)
    })
    // ------------------------ //

    // Запрещаем переход если кнопка не активна на шаге или запускаем проверку на 5,9 шаге //
    $('main').on('click', '.idc-button_disabled, .idc-button_checked.idc-button_enabled', function (e) {
        e.preventDefault()
        if ($(this).is('.idc-button_checked.idc-button_enabled')) {
            var $this = $(this),
                $thisQuestionBlock = $this.closest('.idc__qestion-block'),
                AllAnswerText = $thisQuestionBlock.find('.idc-answers_texts'),
                AllAnswer = $thisQuestionBlock.find('.idc-answer'),
                condition,
                TrueAnswerCount = 0,
                AnswerText,
                CheckAnswer = TrueAnswer[StepNumber - 1].trueanswer.length
            if (StepNumber == 5) {
                // Функция проверки правильный ответ или нет
                drake.destroy()
                AllAnswer.each(function (i, elem) {
                    var elemDataAnswer = parseInt($(elem).children('.idc-answer__text').attr('data-answer')),
                        NowTrueAnswer = TrueAnswer[StepNumber - 1].trueanswer[i]
                    if (elemDataAnswer == NowTrueAnswer) {
                        condition = 'true'
                        TrueAnswerCount += 1
                    } else condition = 'false'
                    $(elem).addClass('idc-' + condition + '')
                })
                condition = 'false'
                if (TrueAnswerCount == CheckAnswer) {
                    rightAnswer += 1
                    condition = 'true'
                    AnswerText = AllAnswerText.children('.idc-' + condition + '')
                } else if (TrueAnswerCount < CheckAnswer && TrueAnswerCount > 0) AnswerText = AllAnswerText.children('.idc-' + condition + ':last-child')
                else if (TrueAnswerCount == 0) AnswerText = AllAnswerText.children('.idc-' + condition + ':not(:last-child)')
            }
            if (StepNumber == 9) {
                var FalseCount = 0
                /*  { trueanswer: [2, 3, 4] }] */
                AllAnswer.each(function (i, elem) {
                    var AnswerIndex = $(elem).index()
                    if (TrueAnswer[StepNumber - 1].trueanswer.indexOf(AnswerIndex + 1) != -1) {
                        if ($(elem).find('.idc-answer__checkbox:checked').length) {
                            condition = 'true'
                            TrueAnswerCount += 1
                        } else {
                            condition = 'must_true'
                        }
                    } else if ($(elem).find('.idc-answer__checkbox:checked').length) {
                        condition = 'false'
                        FalseCount += 1
                    } else {
                        condition = ''
                    }
                    if (condition != '') $(elem).addClass('idc-' + condition + '')
                })
                condition = 'false'
                if (TrueAnswerCount == CheckAnswer && FalseCount == 0) {
                    rightAnswer += 1
                    condition = 'true'
                    AnswerText = AllAnswerText.children('.idc-' + condition + '')
                } else if ((TrueAnswerCount < CheckAnswer && TrueAnswerCount > 0) ||
                    (TrueAnswerCount == CheckAnswer && FalseCount > 0)) {
                    AnswerText = AllAnswerText.children('.idc-' + condition + ':last-child')
                } else if (TrueAnswerCount == 0) AnswerText = AllAnswerText.children('.idc-' + condition + ':not(:last-child)')
                AllAnswer.find('.idc-answer__checkbox').attr('disabled', true)
            }
            $thisQuestionBlock.find('.idc-answer-area').addClass('open idc-' + condition + '')
            AnswerText.appendTo($thisQuestionBlock.find('.idc-answer-area'))
            if (StepNumber < TrueAnswer.length)
                StepNumber += 1
            $this.removeClass('idc-button_checked').children('span').text($this.attr('data-text'))
            if (StepNumber == 9) {
                console.log(StepNumber, rightAnswer)
            }
        }
    })
    // ------------------------ //

    // Функциоанал перехода на новую ссылку
    $('main').on('click', '.idc-main__button-link:not(.idc-button_disabled), .idc-button.idc-button_enabled:not(.idc-button_checked)', function (e) {
        console.log(StepNumber, rightAnswer)
        e.preventDefault()
        RefreshPage($(this))
    })
    // ------------------------ //

    // Функция вызова перезагрузки контента на странице 
    let RefreshPage = function ($this) {
        var NewLink = $($this).attr('href')
        /*  console.log(NewLink) */
        /*   window.location.hash = NewLink.substr(0, NewLink.length - 5); */
        if ($this.closest('.idc-modal_open').length) {
            blockScroll('close')
            $this.closest('.idc-modal_open').fadeOut({
                duration: 200,
                complete: function () {
                    $(this).removeClass('idc-modal_open')
                }
            })
        }
        if (NewLink.includes('hello')) {
            $('.idc-container:not(.idc-container_error)').fadeOut({
                duration: 300,
                step: function (now) {
                    if (now <= 0) {
                        $('main').removeClass('idc-main').addClass('idc-hello')
                        loadcontent(NewLink)
                    }
                }
            })
        }
        if (NewLink.includes('step')) {
            let NowStepClass = 'idc-step-'
            $('.idc-container:not(.idc-container_error)').fadeOut({
                duration: 300,
                step: function (now) {
                    if (now <= 0) {
                        $('main').removeClass('idc-hello ' + (NowStepClass + (StepNumber - 1)) + '').addClass('' + (NowStepClass + StepNumber) + '')
                        loadcontent(NewLink)
                    }
                }
            })
        }
        if (StepNumber == 9) {
            let FinishClass, NewLink
            if (rightAnswer >= 7) {
                FinishClass = 'good'
            }
            if (rightAnswer < 7 && rightAnswer >= 4) {
                FinishClass = 'normal'
            }
            if (rightAnswer < 4) {
                FinishClass = 'bad'
            }
            NewLink = 'finish-' + FinishClass + '.html'
            $('.idc-container:not(.idc-container_error)').fadeOut({
                duration: 300,
                step: function (now) {
                    if (now <= 0) {
                        $('main').removeClass('idc-step-' + StepNumber + '').addClass('idc-finish-' + FinishClass + '')
                        loadcontent(NewLink, rightAnswer)
                    }
                }
            })
        }
        /*         else {
                    $('.idc-container:not(.idc-container_error)').fadeOut({
                        duration: 300,
                        step: function (now) {
                            if (now <= 0) {
                                loadcontent(NewLink)
                            }
                        }
                    })
                } */
    }
    // ---------------------------------- //

    // Функция инициализации тултипов //
    TooltipMobile(docWidth)
    // ---------------------------------- //


    // Функция проверки правильный ответ или нет
    let EditAnswer = function (answer, QuestionBlock, stepNumber) {
        var TextWrapper, condition
        if ((answer.index() + 1) == TrueAnswer[stepNumber - 1].trueanswer) condition = 'true'
        else condition = 'false'
        TextWrapper = QuestionBlock.find('.idc-answers_texts > .idc-answer__info.idc-' + condition + '')
        /*  if (stepNumber == 3 || stepNumber == 6) answer = answer.closest('.idc-answers__wrapper').siblings('.idc-answer-area') */
        if (stepNumber == 3 || stepNumber == 6) answer = answer.closest('.idc-answers__wrapper').siblings('.idc-button-block_fixed').find('.idc-answer-area')
        $(TextWrapper).appendTo(answer)
        setTimeout(function () {
            answer.addClass('open')
        }, 100)
        answer.addClass('idc-' + condition + '');
        if (condition == 'true') rightAnswer += 1
        stepNumber += 1
        return stepNumber
    }
    // ---------------------------------- //


    // Обработчик изменеия рейтинга //
    $('main').on('change', '.idc-rate__radio', function (e) {
        $(this).closest('.idc-rate-area').find('.idc-rate__radio').attr('disabled', true)
        $(this).closest('.idc-rate__wrapper').find('.idc-rate__text').hide().text('Спасибо!').fadeIn()
    })

    // Загрузка страницы приветствия по скролу на колесико //
    var weelEvt = (/Firefox/i.test(navigator.userAgent)) ? 'DOMMouseScroll' : 'mousewheel'
    $('body').bind(weelEvt, function (e) {
        console.log(weelEvt)
        if ($('.idc-main').length && docWidth >= 1200 && !$('.idc-container_error.show').length) {
            e.preventDefault()
            var evt = e.originalEvent ? e.originalEvent : e,
                delta = evt.detail ? evt.detail * (-40) : evt.wheelDelta
            /*  console.log('Скроллим ' + (delta > 0 ? 'вверх' : 'вниз')); */
            if (delta < 0) {
                var NewLink = $('.idc-main .idc-main__button-wrapper .idc-main__button-link').attr('href')
                $('.idc-container:not(.idc-container_error)').fadeOut({
                    duration: 300,
                    step: function (now) {
                        if (now <= 0) {
                            $('main').removeClass('idc-main').addClass('idc-hello')
                            loadcontent(NewLink)
                        }
                    }
                })
            }
        } else {
            $('body').unbind(weelEvt)
            return false
        }
    })

    // ---------------------------------- //
}); // jquery ready end



// Функция инициализации gragula //
var drake
let InitDragula = function () {
    if ($('#idc-answers__container').length) {
        drake = dragula([document.getElementById('idc-answers__container')], {
            revertOnSpill: true,
        });
        drake.on('dragend', function (e) {
            var Btn = $('.idc__qestion-block .idc-button_disabled'),
                Answers = $('.idc-answers__wrapper .idc-answer')
            Btn.removeClass('idc-button_disabled').addClass('idc-button_enabled')
            Answers.each(function () {
                var AnswerIndex = $(this).index()
                $(this).find('.idc-answer__position').text(AnswerIndex + 1)
            })
            $('.idc__qestion-block .idc-answer__position').addClass('show')
        })

    }
}
// ---------------------------------- //

// Функция инициализации галереи //
let InitGallery = function () {
    /* LightGallery */
    if ($(".lightgallery").length) {
        $(".lightgallery").lightGallery({
            share: false,
            videojs: false,
            actualSize: false,
            autoplay: false,
            autoplayControls: false,
            autoplayFirstVideo: false,
            download: false,
            thumbnail: false,
            exThumbImage: 'data-exthumbimage',
        });
    } else return false
}
// ---------------------------------- //

// Функция наведения на 4 шаге //
function Step4Move() {
    const answer = $('.idc-answer__text')
    const steps = $('.idc-step')
    // console.log(steps)
    $(answer).on('mouseover', function () {
        /*       console.log($(this).prev('.idc-answer__radio:not(:checked):not(:disabled)'))
              console.log($(this)) */
        if ($(this).prev('.idc-answer__radio:not(:checked):not(:disabled)').length) {
            steps.removeClass('idc-steps_disbled')
            let stepsClasses = $(this).attr('data-answer')
            if (steps.length) {
                let stepClass = stepsClasses.split(' ')

                // console.log(stepClass)
                $.each(stepClass, function (index, value) {
                    $('' + value + '').addClass('idc-steps_disbled');
                })
            }
        }
    })
}
// ---------------------------------- //

// Функция асинхронной подгрузки нового контента на страницу
let loadcontent = function (link, CountAnswer) {
    $.ajax({
        url: link,
        /*   cache: false, */
        dataType: 'html',
        success: function (response) {
            var ModalWrapper = $(response).find(".idc-modal"),
                ModalZoomWrapper = $(response).find('.idc-modal-answer'),
                ContentWrapper = $(response).find('.idc-container')
            // console.log(ModalZoomWrapper)
            $('.idc-container:not(.idc-container_error)').remove()
            $('.idc-modal').remove()
            $('.idc-modal-answer').remove()
            ContentWrapper.prependTo('main')
            var dur = 500,
                delay = 0
            if ($('.idc-container').closest('.idc-step-6').length) delay = 300
            $('.idc-container:not(.idc-container_error)').hide().delay(delay).fadeIn({
                duration: dur,
                start: function () {
                    window.scrollTo(0, 0)
                    InitTyped()
                    InitAos()
                },
                step: function (now) {
                    if (now >= 0.5 && now <= 0.8) {
                        bgWrapper()
                    }
                    $(this).find('.idc-point-count').text(CountAnswer)
                },
                complete: function () {
                    InitGallery()
                    if ($(this).find('#idc-answers__container').length) {
                        InitDragula()
                    }
                }
            })
            if ($('main.idc-step-4').length) {
                Step4Move()
            }
            ModalWrapper.prependTo('main')
            ModalZoomWrapper.insertAfter('.idc-modal')
            TooltipMobile(docWidth)
        },
        error: function (request, status, error) {
            // console.log(request.status)
            errorShow(request.status)
        },
        statusCode: {
            200: function () {
                /*  console.log($(this)) */
            },
            404: function () { // выполнить функцию если код ответа HTTP 404
                let Status = '404'
                errorShow(Status)
            },
            403: function () { // выполнить функцию если код ответа HTTP 403
                let Status = '403'
                errorShow(Status)
            },
            408: function () { // превышено время
                let Status = '408'
                errorShow(Status)
            },
            504: function () { // превышено время
                alert("доступ запрещен");
                let Status = '504'
                errorShow(Status)
            }
        }
    });
    return false;
}
// ---------------------------------- //

// Функция прерывания загрузки новой страницы
let errorShow = function (status) {
    if (status == '0') status = '408'
    $('.idc-parralax-wrapper').prependTo('.idc-container_error')
    $('main').attr('class', '').addClass('idc-main idc-page-style')
    $('.idc-container_error').find('.idc-404__hashtag').text('#' + status)
    $('.idc-container_error').find('.idc-404-bg').text(status)
    $('.idc-container_error').fadeIn( /* { complete: function () { $(this).addClass('show') } } */).addClass('show')
}
// ---------------------------------- //

// Массив обьектов с правильными ответами
let TrueAnswer = [
    { trueanswer: 1 },
    { trueanswer: 2 },
    { trueanswer: 3 },
    { trueanswer: 3 },
    { trueanswer: [1, 2, 3, 4] },
    { trueanswer: 1 },
    { trueanswer: 1 },
    { trueanswer: 4 },
    { trueanswer: [2, 3, 4] }
]
/* console.log(TrueAnswer.length) */
// ---------------------------------- //
// console.log(TrueAnswer[0].trueanswer)

// Функция для тултипов в адаптиве
let TooltipMobile = function (docwidth) {
    if (docwidth < 1200 && $('.idc-information').length) {
        var MainWrapper = document.querySelector('.idc-step-1');
        console.log(MainWrapper)
        let AllTooltip = [].slice.call(MainWrapper.querySelectorAll('.idc-information'));
        /*  console.log(AllTooltip); */
        AllTooltip.forEach(function (elem) {
            elem.addEventListener('click', function () {
                /*    console.log(this); */
                elem.classList.add('open');
            })
        });
        MainWrapper.addEventListener('click', function (e) { // событие клика по веб-документу
            let ToolTipOpen = MainWrapper.querySelector('.idc-information.open')
            /*    console.log(ToolTipOpen); */
            const target = e.target;
            if (ToolTipOpen != null) {
                if (ToolTipOpen.contains(target)) return false
                else {
                    ToolTipOpen.classList.remove('open')
                }
            }
        });
    } else return false;
}
//----------------------//

// Ресайз
$(window).on('resize', function () {
    bgWrapper()
})
//----------------------//

// jquery window onload start
$(window).on('load', function () {
    let pageBackground = $('.idc-page-style')

    pageBackground.on("mousemove", parallax);

    function parallax(event) {
        var AllParrallaxElem = this.querySelectorAll(".idc-bg-item")
        for (var i = 0; i < AllParrallaxElem.length - 1; i++) {
            var shift = AllParrallaxElem[i]
            // console.log(event)
            const position = shift.getAttribute("value");
            const x = (window.innerWidth - event.pageX * position) / 90;
            const y = (window.innerHeight - event.pageY * position) / 90;

            shift.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px)';
        }
    }
    if (docWidth < 768 && $('.idc-main__mobile-button').length) {
        var MainBtn = $('.idc-main__mobile-button')
        /*   console.log(MainBtn.innerHeight()) */
        var TopPositionBtn = MainBtn.offset().top,
            windowHeight = $(window).height()
        /*  console.log(TopPositionBtn) */
        var TopPosition = $(window).scrollTop() + windowHeight
        /*  console.log(TopPosition) */
        // console.log(TopPositionBtn)
        if (TopPosition - TopPositionBtn < 0) {
            MainBtn.addClass('fixed')
            MainBtn.siblings('.idc-main__content-wrapper').css('padding-bottom', MainBtn.innerHeight())
        }
        if (TopPositionBtn && (TopPosition - TopPositionBtn < 0)) {
            $(window).on('scroll', function (e) {
                TopPosition = $(window).scrollTop() + windowHeight
                /* console.log(TopPosition) */
                if (TopPosition >= TopPositionBtn) {
                    MainBtn.removeClass('fixed')
                    MainBtn.siblings('.idc-main__content-wrapper').css('padding-bottom', '')
                }
                if (TopPosition < TopPositionBtn && TopPosition >= 0) {
                    MainBtn.addClass('fixed')
                    MainBtn.siblings('.idc-main__content-wrapper').css('padding-bottom', MainBtn.innerHeight())
                }
            })
        }
    }
}); // jquery window onload end