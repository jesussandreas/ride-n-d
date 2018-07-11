import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart'

autocomplete( $('#address'), $('#lat'), $('#lng') )

typeAhead( $('.search') );

makeMap( $('#map') );

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);

// modal
$$('.book-btn').on('click', function () {
  $('.modal').style.animation = 'modalIn .8s forwards';
  $('.overlay').classList.add('active');
});

$$('#close-btn').on('click', function () {
  $('.modal').style.animation = 'modalOut .8s forwards';
  $('.overlay').classList.remove('active');
});

// burguer menu
$('.burguer-button').on('click', function () {
    $('.nav__section.nav__section--pages').classList.toggle('active')
    $('.nav__section.nav__section--user').classList.toggle('active')
});
