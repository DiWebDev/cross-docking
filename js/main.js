// import createLabel from "./helpers/cases.mjs";

// статусы
const statusSelect = document.querySelector('.status__options');
// номер поставки
const packageId = document.getElementById('package');
// склад отгрузки
const whOne = document.getElementById('one');
// склад размещения
const whTwo = document.getElementById('two');
// контейнер с инпутами
const inputs = document.querySelector('.wrapper__inputs');
// дата отгрузки
const shipmentDateCal = document.getElementById('start');
// срок приёмки
const expiry = document.getElementById('expiry');
// количество дней в пути
const daysAmount = document.getElementById('amount');
// кнопка расчёта
const countBtn = document.getElementById('count');
// сообщение если срок истёк
const msg = document.querySelector('.msg__block');
// текущая дата
const today = new Date();
//радиокнопки
const radioButtonsSt = document.querySelectorAll('input[name="st"]');
const radioButtonsPr = document.querySelectorAll('input[name="partner"]');
// окно модалки
const modal = document.querySelector('.modal');
// контейнер кнопки
const btnWrapper = document.querySelector('.wrapper__btn');
// сброс
const resetBtn = document.querySelector('.reset');
// получить ответ
const answerBtn = document.querySelector('.answer-button');
// кнопка закрытия модалки
const modalClose = document.querySelector('.modal__close');
// контейнер текста модалки
const modalContent = document.querySelector('.modal__content');

const answerCopyBtn = document.querySelector('.modal__copy-btn');
const copyPopUp = document.querySelector('.modal__copy-popup');

let answer;
let two;

let inputsToggle = [...inputs.querySelectorAll('input')];

// текст
let modalText;
let modalResolution;
let resolutin;
let lastDate;

class Answer {
  static async getAnswer(stValue, prValue) {
    try {
      let result = await fetch('./data/data.json');
      let res = await result.json(Object);
      for (let partner in res) {
        if (prValue == partner) {
          for (let status in res[partner]) {
            if (stValue == status) {
              answer = res[partner][status].answer;
              resolutin = res[partner][status].resolution;
              answer = answer.replace('DATE', two);
              answer = answer.replace('N', `№${packageId.value}`);
              answer = answer.replace('WhONE', whOne.value);
              answer = answer.replace('WhTWO', whTwo.value);
              answer = answer.replace('COUNT', daysAmount.value);
              answer = answer.replace(
                'DAY',
                SelectChange.casesLogic(daysAmount.value, ['день', 'дня', 'дней']),
              );
              modalText = document.createElement('p');
              modalResolution = document.createElement('p');
              modalText.innerText = answer;
              modalResolution.innerText = resolutin;
              modalContent.appendChild(modalText);
              resolutin ? modalContent.appendChild(modalResolution) : '';
              answerCopyBtn.addEventListener('click', () => {
                copyPopUp.classList.add('active');
                setTimeout(() => copyPopUp.classList.remove('active'), 1000);
                navigator.clipboard.writeText(answer);
              });
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
class SelectChange {
  static statusChange() {
    statusSelect.addEventListener('change', () => {
      SwitchLogic.clearModal();
      let stValue;
      let prValue;
      for (const st of radioButtonsSt) {
        if (st.checked) {
          stValue = st.value;
        }
      }
      for (const pr of radioButtonsPr) {
        if (pr.checked) {
          prValue = pr.value;
        }
      }

      if (stValue && prValue) {
        answerBtn.disabled = false;
      } else {
        answerBtn.disabled = true;
      }

      Answer.getAnswer(stValue, prValue);
    });
  }
  static casesLogic(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return `${
      titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]]
    }`;
  }
}

class ButtonsLogic {
  static countDaysBtn() {
    // Кнопка рассчёта (вышел срок приёмки или нет)
    countBtn.addEventListener('click', () => {
      let date = new Date(shipmentDateCal.value);
      let arrivalDate = new Date(date.setDate(date.getDate() + +daysAmount.value - 1));
      DataCountLogic.calculateExpiryDate(arrivalDate);
      SwitchLogic.deactivate();
      SwitchLogic.addActive();
      inputsToggle.forEach((i) => (i.disabled = true));
    });
  }

  static resetDataBtn() {
    resetBtn.addEventListener('click', () => {
      packageId.value = '';
      whOne.value = '';
      whTwo.value = '';
      shipmentDateCal.value = '';
      daysAmount.value = '';
      expiry.innerText = 'не рассчитан';
      SwitchLogic.removeActive();
      statusSelect.classList.remove('active');
      expiry.classList.remove('negative');
      msg.classList.remove('active');
      SwitchLogic.clearRadio();
      answerBtn.disabled = true
      inputsToggle.forEach((i) => (i.disabled = false));
    });
  }
}

class DataCountLogic {
  // расчёт конечной даты приёмки
  static calculateEndDate(startDate) {
    let array = [];
    const start = new Date(startDate);
    let daysCount = 0;
    while (daysCount < 5) {
      array.push(new Date(start.setDate(start.getDate() + 1)));
      ++daysCount;
    }
    lastDate = array.at(-1);

    array.forEach((d) => {
      if (d.getDay() == 0) {
        array.push(new Date(lastDate.setDate(lastDate.getDate() + 1)));
      }
    });

    array.forEach((d) => {
      if (d.getDay() == 6) {
        array.push(new Date(lastDate.setDate(lastDate.getDate() + 1)));
      }
    });

    if (array.at(-1).getDay() === 6) {
      array.push(new Date(lastDate.setDate(lastDate.getDate() + 2)));
    }

    if (array.at(-1).getDay() === 0) {
      array.push(new Date(lastDate.setDate(lastDate.getDate() + 1)));
    }

    this.checkStatusDate(lastDate);

    return lastDate;
  }
  // расчёт даты проверки статуса
  static checkStatusDate(statusDate) {
    let one = new Date(statusDate.setDate(statusDate.getDate() + 1));
    two = new Date(one).toLocaleString('ru', {
      month: 'long',
      day: 'numeric',
    });
    return two;
  }

  static calculateExpiryDate(arrivalDate) {
    if (today > this.calculateEndDate(arrivalDate)) {
      expiry.innerText = 'вышел';
      expiry.classList.add('negative');
      msg.classList.add('active');
    } else {
      expiry.innerText = 'не вышел';
      expiry.classList.add('positive');
      statusSelect.classList.add('active');
    }
  }
}

class SwitchLogic {
  static activate() {
    countBtn.disabled = false;
  }

  static deactivate() {
    countBtn.disabled = true;
  }

  static addActive() {
    btnWrapper.classList.add('active');
    resetBtn.classList.add('active');
  }

  static removeActive() {
    btnWrapper.classList.remove('active');
    resetBtn.classList.remove('active');
    statusSelect.classList.remove('active');
    expiry.classList.remove('positive');
  }

  static addModalActive() {
    answerBtn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  }

  static clearRadio() {
    const ele = document.querySelectorAll('input[type=radio]');
    for (var i = 0; i < ele.length; i++) {
      ele[i].checked = false;
    }
    this.clearModal();
  }

  static clearModal() {
    const arr = [...modalContent.children];
    arr.forEach((item) => {
      if (item) {
        modalContent.removeChild(item);
      }
    });
  }

  static removeModalActive() {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
      answerBtn.disabled = true;
      this.clearRadio();
    });
  }

  //! по желанию
  // static closeModalWrapper() {
  // }
}

class InputLogic {
  static inputOnchange() {
    inputs.addEventListener('input', () => {
      if (
        packageId.value != '' &&
        whOne.value != '' &&
        whTwo.value != '' &&
        shipmentDateCal.value != '' &&
        daysAmount.value != ''
      ) {
        SwitchLogic.activate();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  SelectChange.statusChange();
  ButtonsLogic.countDaysBtn();
  ButtonsLogic.resetDataBtn();
  SwitchLogic.addModalActive();
  SwitchLogic.removeModalActive();
  InputLogic.inputOnchange();
  // SwitchLogic.closeModalWrapper();
});
