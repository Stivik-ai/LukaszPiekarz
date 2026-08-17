/* Łukasz Piekarz — roboty ziemne
   Bez bibliotek. Wszystko działa też, gdy JS się nie wczyta:
   menu jest wtedy widoczne po scrollu, mapy mają link, zdjęcia otwierają się
   jako zwykłe pliki. */

(function () {
    "use strict";

    /* ---------------------------------------------------------- rok w stopce */
    var rok = document.getElementById("rok");
    if (rok) rok.textContent = new Date().getFullYear();

    /* ------------------------------------------------------------ menu mobile */
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav");

    if (toggle && nav) {
        var setMenu = function (open) {
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute(
                "aria-label",
                open ? "Zamknij menu" : "Otwórz menu"
            );
            nav.setAttribute("data-open", String(open));
        };

        setMenu(false);

        toggle.addEventListener("click", function () {
            setMenu(toggle.getAttribute("aria-expanded") !== "true");
        });

        nav.addEventListener("click", function (e) {
            if (e.target.closest("a")) setMenu(false);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") setMenu(false);
        });

        document.addEventListener("click", function (e) {
            if (toggle.getAttribute("aria-expanded") !== "true") return;
            if (e.target.closest(".site-header")) return;
            setMenu(false);
        });
    }

    /* ------------------------------------------------- nagłówek po przewinięciu */
    var header = document.querySelector(".site-header");
    if (header) {
        var ticking = false;
        var syncHeader = function () {
            header.classList.toggle("is-scrolled", window.scrollY > 12);
            ticking = false;
        };
        window.addEventListener(
            "scroll",
            function () {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(syncHeader);
            },
            { passive: true }
        );
        syncHeader();
    }

    /* ------------------------------------------------- delikatne pojawianie się */    var reveals = document.querySelectorAll(".reveal");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reveals.length && "IntersectionObserver" in window && !reduced) {
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    io.unobserve(entry.target);
                });
            },
            { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
        );
        reveals.forEach(function (el) {
            io.observe(el);
        });
    } else {
        reveals.forEach(function (el) {
            el.classList.add("is-visible");
        });
    }

    /* ------------------------------------------- mapy Google dopiero na kliknięcie
       Dwa osadzone iframe'y to ponad megabajt transferu przy każdym wejściu.
       Wczytujemy je tylko wtedy, gdy ktoś naprawdę chce zobaczyć mapę. */
    document.querySelectorAll(".map-facade").forEach(function (facade) {
        facade.addEventListener("click", function (e) {
            var src = facade.getAttribute("data-map");
            if (!src) return; // brak danych — zostaje zwykły link do Map Google
            e.preventDefault();
            var frame = document.createElement("iframe");
            frame.src = src;
            frame.title = facade.getAttribute("data-title") || "Mapa";
            frame.loading = "lazy";
            frame.allowFullscreen = true;
            frame.referrerPolicy = "no-referrer-when-downgrade";
            facade.parentNode.appendChild(frame);
            facade.remove();
        });
    });


    /* ------------------------------------------- podświetlenie aktywnej sekcji */
    var navLinks = Array.prototype.slice.call(
        document.querySelectorAll('.nav__list a[href*="#"]')
    );
    var watched = navLinks
        .map(function (a) {
            var id = a.getAttribute("href").split("#")[1];
            var el = id ? document.getElementById(id) : null;
            return el ? { link: a, el: el } : null;
        })
        .filter(Boolean);

    if (watched.length && "IntersectionObserver" in window) {
        var spy = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    var item = watched.filter(function (w) {
                        return w.el === entry.target;
                    })[0];
                    if (!item) return;
                    item.link.classList.toggle(
                        "is-active",
                        entry.isIntersecting
                    );
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        watched.forEach(function (w) {
            spy.observe(w.el);
        });
    }

    /* --------------------------------------------------- formularz kontaktowy
       Walidacja po polsku, komunikat przy konkretnym polu, blokada podwójnej
       wysyłki. Bez JS zostaje walidacja przeglądarki — formularz działa dalej. */
    var form = document.querySelector(".contact-main form");
    if (form) {
        form.setAttribute("novalidate", "novalidate");

        var messageFor = function (input) {
            var v = input.value.trim();
            if (input.hasAttribute("required") && !v) {
                return {
                    "f-name": "Podaj imię, żebym wiedział, do kogo mówię.",
                    "f-mail": "Bez adresu e-mail nie mam jak odpisać.",
                    "f-msg": "Napisz w dwóch zdaniach, co trzeba zrobić."
                }[input.id];
            }
            if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
                return "Ten adres wygląda na niepełny — sprawdź go proszę.";
            }
            if (input.type === "tel" && v && v.replace(/\D/g, "").length < 9) {
                return "Numer wygląda na za krótki.";
            }
            return null;
        };

        var showError = function (input, text) {
            var field = input.closest(".field");
            var box = field.querySelector(".field-error");
            if (!box) {
                box = document.createElement("span");
                box.className = "field-error";
                box.id = input.id + "-error";
                field.appendChild(box);
            }
            box.textContent = text;
            field.classList.add("has-error");
            input.setAttribute("aria-invalid", "true");
            input.setAttribute("aria-describedby", box.id);
        };

        var clearError = function (input) {
            var field = input.closest(".field");
            if (!field) return;
            var box = field.querySelector(".field-error");
            if (box) box.remove();
            field.classList.remove("has-error");
            input.removeAttribute("aria-invalid");
            input.removeAttribute("aria-describedby");
        };

        var fields = Array.prototype.slice.call(
            form.querySelectorAll("input:not([type=hidden]):not(.honey), textarea")
        );

        fields.forEach(function (input) {
            input.addEventListener("input", function () {
                if (input.closest(".field").classList.contains("has-error")) {
                    if (!messageFor(input)) clearError(input);
                }
            });
            input.addEventListener("blur", function () {
                var msg = messageFor(input);
                if (msg) showError(input, msg);
            });
        });

        form.addEventListener("submit", function (e) {
            var firstBad = null;
            fields.forEach(function (input) {
                var msg = messageFor(input);
                if (msg) {
                    showError(input, msg);
                    if (!firstBad) firstBad = input;
                } else {
                    clearError(input);
                }
            });

            if (firstBad) {
                e.preventDefault();
                firstBad.focus();
                return;
            }

            var submit = form.querySelector('button[type="submit"]');
            if (submit) {
                submit.setAttribute("aria-busy", "true");
                submit.setAttribute("disabled", "disabled");
                submit.childNodes[0].nodeValue = " Wysyłam… ";
            }
        });
    }

    /* ------------------------------------------------------------- lightbox */
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));
    if (!tiles.length) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("data-open", "false");
    box.setAttribute("aria-hidden", "true");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Podgląd zdjęcia");
    box.innerHTML =
        '<div>' +
        '<img alt="" />' +
        '<p class="lightbox__caption"></p>' +
        "</div>" +
        '<button class="lightbox__btn lightbox__close" type="button" aria-label="Zamknij">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        "</button>" +
        '<button class="lightbox__btn lightbox__btn--prev" type="button" aria-label="Poprzednie zdjęcie">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18 9 12l6-6"/></svg>' +
        "</button>" +
        '<button class="lightbox__btn lightbox__btn--next" type="button" aria-label="Następne zdjęcie">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
        "</button>";
    document.body.appendChild(box);

    var bigImg = box.querySelector("img");
    var caption = box.querySelector(".lightbox__caption");
    var btnClose = box.querySelector(".lightbox__close");
    var btnPrev = box.querySelector(".lightbox__btn--prev");
    var btnNext = box.querySelector(".lightbox__btn--next");
    var current = 0;
    var lastFocus = null;

    function show(index) {
        current = (index + tiles.length) % tiles.length;
        var tile = tiles[current];
        var thumb = tile.querySelector("img");
        bigImg.src = tile.getAttribute("href");
        bigImg.alt = thumb ? thumb.alt : "";
        caption.textContent =
            (current + 1) +
            " / " +
            tiles.length +
            " · " +
            (tile.getAttribute("data-caption") || "");

        // ciche pobranie sąsiednich zdjęć, żeby strzałki działały bez czekania
        [current - 1, current + 1].forEach(function (i) {
            var next = tiles[(i + tiles.length) % tiles.length];
            if (next) new Image().src = next.getAttribute("href");
        });
    }

    function open(index) {
        lastFocus = document.activeElement;
        show(index);
        box.setAttribute("data-open", "true");
        box.setAttribute("aria-hidden", "false");
        document.documentElement.style.overflow = "hidden";
        btnClose.focus();
    }

    function close() {
        box.setAttribute("data-open", "false");
        box.setAttribute("aria-hidden", "true");
        document.documentElement.style.overflow = "";
        if (lastFocus) lastFocus.focus();
        setTimeout(function () {
            if (box.getAttribute("data-open") === "false") bigImg.src = "";
        }, 320);
    }

    tiles.forEach(function (tile, i) {
        tile.addEventListener("click", function (e) {
            e.preventDefault();
            open(i);
        });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () {
        show(current - 1);
    });
    btnNext.addEventListener("click", function () {
        show(current + 1);
    });

    box.addEventListener("click", function (e) {
        if (e.target === box || e.target === bigImg.parentNode) close();
    });

    document.addEventListener("keydown", function (e) {
        if (box.getAttribute("data-open") !== "true") return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(current - 1);
        if (e.key === "ArrowRight") show(current + 1);
        if (e.key === "Tab") {
            // proste utrzymanie fokusu wewnątrz okna
            e.preventDefault();
            var order = [btnClose, btnPrev, btnNext];
            var i = order.indexOf(document.activeElement);
            order[(i + (e.shiftKey ? -1 : 1) + order.length) % order.length].focus();
        }
    });

    /* przesunięcie palcem na telefonie */
    var startX = null;
    box.addEventListener(
        "touchstart",
        function (e) {
            startX = e.changedTouches[0].clientX;
        },
        { passive: true }
    );
    box.addEventListener(
        "touchend",
        function (e) {
            if (startX === null) return;
            var dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 55) show(current + (dx < 0 ? 1 : -1));
            startX = null;
        },
        { passive: true }
    );
})();