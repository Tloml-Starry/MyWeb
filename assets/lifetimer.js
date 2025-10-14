(function(){
  function calculate(birthDate) {
    const now = new Date();
    const birth = new Date(birthDate);
    const diff = now - birth;
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { years, months, days, hours, minutes, seconds, totalDays };
  }

  function renderTimer(container, person) {
    const time = calculate(person.birthDate);

    const birth = new Date(person.birthDate);
    const now = new Date();
    let nextBirthday;
    if (person.customNextBirthday) {
      nextBirthday = new Date(person.customNextBirthday);
    } else {
      const nextBirthdayYear = (now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() > birth.getDate()))
        ? now.getFullYear() + 1
        : now.getFullYear();
      nextBirthday = new Date(nextBirthdayYear, birth.getMonth(), birth.getDate());
    }
    const daysToBirthday = Math.ceil((nextBirthday - now) / (1000 * 60 * 60 * 24));

    const zodiacs = ['猴','鸡','狗','猪','鼠','牛','虎','兔','龙','蛇','马','羊'];
    const zodiac = zodiacs[birth.getFullYear() % 12];
    const starSigns = [
      '摩羯','水瓶','双鱼','白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手'
    ];
    function getStarSign(d,m){
      const day = d, month = m + 1;
      const edge = [20,19,21,20,21,22,23,23,23,24,23,22];
      const idx = (month - 1 + (day >= edge[month-1] ? 1 : 0)) % 12;
      return starSigns[idx];
    }
    const star = getStarSign(birth.getDate(), birth.getMonth());
    const weeksLived = Math.floor(time.totalDays / 7);
    let extraBadges = '';
    if (Array.isArray(person.anniversaries)) {
      extraBadges = person.anniversaries.map(a => {
        const target = new Date(a.date);
        const d = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        const label = d >= 0 ? `${d} 天` : `已过 ${Math.abs(d)} 天`;
        return `<span class=\"lt-badge\"><strong>${a.title}</strong>${label}</span>`;
      }).join('');
    }
    const zodiacYear = birth.getFullYear();
    const isBenMingNian = ((new Date().getFullYear() - zodiacYear) % 12) === 0;

    container.innerHTML = `
      <h2 class=\"lt-title-sub\">${person.name} Life Timer</h2>
      <div class=\"lt-badges\">\
        <span class=\"lt-badge\"><strong>生日倒计时</strong>${daysToBirthday} 天</span>\
        <span class=\"lt-badge\"><strong>年龄</strong>${(person.nominalAge ?? time.years)} 岁</span>\
        <span class=\"lt-badge\"><strong>星座</strong>${star}</span>\
        <span class=\"lt-badge ${isBenMingNian ? 'lt-badge--accent' : ''}'\"><strong>生肖</strong>${zodiac}${isBenMingNian ? '（本命年）' : ''}</span>\
        <span class=\"lt-badge\"><strong>已生活</strong>${weeksLived} 周</span>\
        ${extraBadges}\
      </div>
      <div class=\"lt-total-days\">${time.totalDays.toLocaleString()} 天</div>
      <div class=\"lt-grid\">\
        <div class=\"lt-item\"><div class=\"lt-value\">${time.years}</div><div class=\"lt-label\">年</div></div>\
        <div class=\"lt-item\"><div class=\"lt-value\">${time.months}</div><div class=\"lt-label\">月</div></div>\
        <div class=\"lt-item\"><div class=\"lt-value\">${time.days}</div><div class=\"lt-label\">日</div></div>\
        <div class=\"lt-item\"><div class=\"lt-value\">${time.hours}</div><div class=\"lt-label\">小时</div></div>\
        <div class=\"lt-item\"><div class=\"lt-value\">${time.minutes}</div><div class=\"lt-label\">分钟</div></div>\
        <div class=\"lt-item\"><div class=\"lt-value\">${time.seconds}</div><div class=\"lt-label\">秒</div></div>\
      </div>`;
    container.classList.remove('is-visible');
    void container.offsetWidth;
    container.classList.add('is-visible');
  }

  function initPage(config, options) {
    const opts = Object.assign({
      useNominalAge: false, // 虚岁
      customNextBirthday: null, // 可手动指定下次生日 Date 或 ISO 字符串（用于农历）
      anniversaries: [] // [{ title: '纪念日', date: '2025-12-31' }]
    }, options);
    const body = document.body;
    body.classList.add('lt-body');
    const container = document.querySelector('[data-lt-container]');
    const tabsEl = document.querySelector('[data-lt-tabs]');
    const timerEl = document.querySelector('[data-lt-timer]');
    if (!container || !tabsEl || !timerEl) return;

    // Build tabs
    tabsEl.innerHTML = '';
    config.people.forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.className = 'lt-tab' + (idx === 0 ? ' is-active' : '');
      btn.type = 'button';
      btn.textContent = p.name;
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.lt-tab').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected','false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected','true');
        renderTimer(timerEl, decoratePerson(p, opts));
      });
      tabsEl.appendChild(btn);
    });

    function start() {
      renderTimer(timerEl, decoratePerson(config.people[0], opts));
    }
    start();
    setInterval(start, 1000);
  }

  function decoratePerson(person, opts){
    // 派生：支持虚岁、可选自定义下次生日、纪念日集合
    const birth = new Date(person.birthDate);
    const now = new Date();

    const nominalAge = now.getFullYear() - birth.getFullYear() + 1; // 虚岁
    const base = Object.assign({}, person);
    if (opts.useNominalAge) {
      base.nominalAge = nominalAge;
    }
    if (opts.customNextBirthday) {
      base.customNextBirthday = new Date(opts.customNextBirthday);
    }
    base.anniversaries = Array.isArray(opts.anniversaries) ? opts.anniversaries.slice(0, 6) : [];
    return base;
  }

  function daysBetween(a, b){
    return Math.ceil((b - a) / (1000*60*60*24));
  }

  window.LifeTimer = { initPage };
})();


