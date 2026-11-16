/**
 * Translates a settings page into Stream Deck's language. The pages are
 * written in German; locales.js (generated) holds the other languages, keyed
 * by the German text. Load before sdpi-components.js: it hooks the connect
 * call to learn the language, and guesses from the browser until then.
 */
(function () {
	var LANGS = ["de", "en", "es", "fr", "ja", "ko", "zh_CN", "zh_TW"];
	function normalize(value) {
		var v = String(value || "").replace("-", "_");
		if (LANGS.indexOf(v) >= 0) return v;
		if (/^zh_(TW|HK|Hant)/i.test(v)) return "zh_TW";
		if (/^zh/i.test(v)) return "zh_CN";
		var base = v.split("_")[0].toLowerCase();
		return LANGS.indexOf(base) >= 0 ? base : "en";
	}
	var source = new WeakMap();
	function tr(lang, de) {
		var table = (window.LD_LOCALES || {})[lang] || {};
		var en = (window.LD_LOCALES || {}).en || {};
		return lang === "de" ? de : table[de] || en[de] || de;
	}
	function apply(lang) {
		document.documentElement.lang = lang.replace("_", "-");
		["label", "placeholder", "loading"].forEach(function (attr) {
			document.querySelectorAll("[" + attr + "]").forEach(function (el) {
				var key = "data-de-" + attr;
				if (!el.hasAttribute(key)) el.setAttribute(key, el.getAttribute(attr));
				el.setAttribute(attr, tr(lang, el.getAttribute(key)));
			});
		});
		// Options: replaced, not edited, so sdpi-select notices the change.
		document.querySelectorAll("option").forEach(function (opt) {
			var de = opt.getAttribute("data-de") || opt.textContent.trim();
			var text = tr(lang, de);
			if (opt.textContent === text) return;
			var next = opt.cloneNode(false);
			next.setAttribute("data-de", de);
			next.textContent = text;
			opt.parentNode.replaceChild(next, opt);
		});
		var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		for (var node = walker.nextNode(); node; node = walker.nextNode()) {
			var p = node.parentNode;
			if (!p || /^(CODE|SCRIPT|STYLE|OPTION)$/.test(p.nodeName)) continue;
			if (!source.has(node)) source.set(node, node.nodeValue);
			var de = source.get(node);
			var trimmed = de.replace(/\s+/g, " ").trim();
			if (!trimmed) continue;
			node.nodeValue = de.replace(de.trim(), tr(lang, trimmed));
		}
	}
	var previous = window.connectElgatoStreamDeckSocket;
	window.connectElgatoStreamDeckSocket = function (port, uuid, event, info, action) {
		try {
			apply(normalize(JSON.parse(info).application.language));
		} catch (e) {}
		if (previous) previous.apply(this, arguments);
	};
	document.addEventListener("DOMContentLoaded", function () {
		apply(normalize(navigator.language));
	});
})();
