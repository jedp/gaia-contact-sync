﻿'use strict';

function navigationStack(currentView) {
  var transitions = {
    'left-right': { from: 'view-left', to: 'view-right'},
    'top-bottom': { from: 'view-bottom', to: 'view-top'},
    'right-left': { from: 'view-right', to: 'view-left'},
    'bottom-top': { from: 'view-top', to: 'view-bottom'}
  };

  var _currentView = currentView;

  var stack = [];
  stack.push({ view: currentView, transition: ''});

  this.go = function go(nextView, transition) {
    if (_currentView === nextView)
      return;

    var current = document.getElementById(_currentView);
    var next = document.getElementById(nextView);
    current.classList.add(transitions[transition].to);
    next.classList.remove(transitions[transition].from);

    stack.push({ view: _currentView, transition: transition});
    _currentView = nextView;
  };

  this.back = function back() {
    if (stack.length < 2)
      return;

    var current = document.getElementById(_currentView);
    var nextView = stack.pop();
    var next = document.getElementById(nextView.view);
    current.classList.add(transitions[nextView.transition].from);
    next.classList.remove(transitions[nextView.transition].to);

    _currentView = nextView.view;
  };
}

var Contacts = (function() {
  var navigation = new navigationStack('view-contacts-list');

  function edit() {
    navigation.go('view-contact-form', 'right-left');
  }

  var TAG_OPTIONS = {
    'phone-type' : [
      {value: 'Mobile'},
      {value: 'Home'},
      {value: 'Work'},
      {value: 'Personal'},
      {value: 'Fax Home'},
      {value: 'Fax Office'},
      {value: 'Other Fax'},
      {value: 'Another'}
    ],
    'email-type' : [
      {value: 'Personal'},
      {value: 'Home'},
      {value: 'Work'}
    ]
  };

  var numberEmails = 0;
  var numberPhones = 0;
  var currentContactId,
      detailsName,
      givenName,
      familyName,
      formTitle,
      formActions,
      phoneTemplate,
      emailTemplate,
      phonesContainer,
      emailContainer,
      selectedTag;

  var currentContact = {};

  var contactsList = contacts.List;

  window.addEventListener('load', function initContacts(evt) {
    currentContactId = document.getElementById('contact-form-id');
    givenName = document.getElementById('givenName');
    familyName = document.getElementById('familyName');
    detailsName = document.getElementById('contact-name-title');
    formTitle = document.getElementById('contact-form-title');
    formActions = document.getElementById('contact-form-actions');
    phoneTemplate = document.getElementById('add-phone');
    emailTemplate = document.getElementById('add-email');
    phonesContainer = document.getElementById('contacts-form-phones');
    emailContainer = document.getElementById('contacts-form-email');

    var list = document.getElementById('groups-list');
    contactsList.init(list);
    contactsList.load();

    contactsList.handleClick(function handleClick(id) {
      var options = {
        filterBy: ['id'],
        filterOp: 'equals',
        filterValue: id
      };

      var request = navigator.mozContacts.find(options);
      request.onsuccess = function findCallback() {
        currentContact = request.result[0];
        reloadContactDetails(currentContact);
        navigation.go('view-contact-details', 'right-left');
      };
    });
  });

  //
  // Method that generates HTML markup for the contact
  //
  var reloadContactDetails = function reloadContactDetails(contact) {
    detailsName.textContent = contact.name;
    var listContainer = document.getElementById('details-list');
    listContainer.innerHTML = '';

    var phonesTemplate = document.getElementById('phone-details-template');
    for (var tel in contact.tel) {
      var telField = {
        number: contact.tel[tel].number || '',
        type: contact.tel[tel].type || TAG_OPTIONS['phone-type'][0].value,
        notes: ''
      };
      var template = utils.templates.render(phonesTemplate, telField);
      listContainer.appendChild(template);
    }

    var emailsTemplate = document.getElementById('email-details-template');
    for (var email in contact.email) {
      var emailField = {
        email: contact.email[email],
        type: ''
      };
      var template = utils.templates.render(emailsTemplate, emailField);
      listContainer.appendChild(template);
    }

    var cover = document.getElementById('cover-img');
    cover.style.backgroundImage = 'url(' + (contact.photo || '') + ')';
  };

  var showEdit = function showEdit() {
    resetForm();
    formTitle.innerHTML = 'Edit contact';
    var editActions = [
      {
        label: 'Finish',
        icon: 'icon-finish',
        callback: saveContact
      }
    ];

    buildActions(editActions);
    currentContactId.value = currentContact.id;
    givenName.value = currentContact.givenName;
    familyName.value = currentContact.familyName;

    for (var tel in currentContact.tel) {
      var telField = {
        number: currentContact.tel[tel].number,
        type: currentContact.tel[tel].type,
        notes: '',
        i: tel
      };

      var template = utils.templates.render(phoneTemplate, telField);
      phonesContainer.appendChild(template);
      numberPhones++;
    }

    for (var email in currentContact.email) {
      var emailField = {
        email: currentContact.email[email],
        type: '',
        i: email
      };

      var template = utils.templates.render(emailTemplate, emailField);
      emailContainer.appendChild(template);
      numberEmails++;
    }

    edit();
  };

  var goToSelectTag = function goToSelectTag(event) {
    var tagList = event.target.dataset.taglist;
    var options = TAG_OPTIONS[tagList];
    fillTagOptions(options, tagList, event.target);
    navigation.go('view-select-tag', 'right-left');
  };

  var fillTagOptions = function fillTagOptions(options, tagList, update) {
    var container = document.getElementById('tags-list');
    container.innerHTML = '';

    var selectedLink;
    for (var option in options) {
      var link = document.createElement('a');
      link.href = '#';
      link.dataset.index = option;
      link.textContent = options[option].value;

      link.onclick = function(event) {
        var index = event.target.dataset.index;
        selectTag(event.target, tagList, update);
      };

      selectedLink = selectedLink || link;
      if (update.textContent == TAG_OPTIONS[tagList][option].value) {
        selectedLink = link;
      }

      var list = document.createElement('li');
      list.appendChild(link);
      container.appendChild(list);
    }
    selectTag(selectedLink);
  };

  var selectTag = function selectTag(link, tagList, update) {
    var index = link.dataset.index;
    if (update) {
      update.textContent = TAG_OPTIONS[tagList][index].value;
    }

    if (selectedTag) {
      // TODO: Regex
      var tagContent = selectedTag.innerHTML;
      var findIcon = tagContent.indexOf('<');
      selectedTag.innerHTML = tagContent.substr(0, findIcon);
    }

    var icon = document.createElement('span');
    icon.className = 'slcl-state icon-selected';
    icon.setAttribute('role', 'button');
    link.appendChild(icon);
    selectedTag = link;
  };


  var showAdd = function showAdd() {
    resetForm();
    formTitle.innerHTML = 'Add Contact';

    insertEmptyPhone(0);
    insertEmptyEmail(0);
    buildActions([
      { label: 'Cancel', icon: 'icon-cancel', callback: navigation.back },
      { label: 'Finish', icon: 'icon-finish', callback: saveContact}
    ]);

    edit();
  };

  var saveContact = function saveContact() {
    var givenName = [givenName.value] || [''];
    var familyName = [familyName.value] || [''];

    var myContact = {
      id: document.getElementById('contact-form-id').value,
      givenName: givenName,
      familyName: familyName,
      name: givenName[0] + ' ' + familyName[0]
    };

    getPhones(myContact);
    getEmails(myContact);

    var contact;
    if (myContact.id) { //Editing a contact
      for (var field in myContact) {
        currentContact[field] = myContact[field];
      }
      contact = currentContact;
    } else {
      contact = new mozContact();
      contact.init(myContact);
    }

    var request = navigator.mozContacts.save(contact);
    request.onsuccess = function onsuccess(contact) {
      contactsList.refresh(contact);
      reloadContactDetails(contact);
      navigation.back();
    };

    request.onerror = function onerror() {
      console.error('Error saving contact');
    }
  };

  var getPhones = function getPhones(contact) {
    var selector = '#view-contact-form form input[data-field="number"]';
    var phones = document.querySelectorAll(selector);
    for (var phone in phones) {
      var numberField = phones[phone].value;
      if (!numberField)
        continue;

      var selector = 'tel_type_' + phone;
      var typeField = document.getElementById(selector).textContent || '';
      var notes = document.getElementById('notes_' + phone).value || '';
      contact['tel'] = contact['tel'] || [];
      // TODO: Save notes
      contact['tel'][phone] = {
        number: numberField,
        type: typeField
      };
    }
  };

  var getEmails = function getEmails(contact) {
    var selector = '#view-contact-form form input[name="email"]';
    var emails = document.querySelectorAll(selector);
    for (var email in emails) {
      var emailField = emails[email].value;
      if (!emailField)
        continue;

      // TODO: Save type
      contact['email'] = contact['email'] || [];
      contact['email'][email] = emailField;
    }
  };

  var insertEmptyPhone = function insertEmptyPhone(index) {
    var telField = {
      number: '',
      type: TAG_OPTIONS['phone-type'][0].value,
      notes: '',
      i: index || 0
    };
    var template = utils.templates.render(phoneTemplate, telField);
    phonesContainer.appendChild(template);
    numberPhones++;
  };

  var insertEmptyEmail = function insertEmptyEmail(index) {
    var emailField = {
      email: '',
      type: '',
      i: index || 0
    };

    var template = utils.templates.render(emailTemplate, emailField);
    emailContainer.appendChild(template);
    numberEmails++;
  };

  var buildActions = function(actions) {
    for (var i in actions) {
      var action = document.createElement('li');
      action.onclick = actions[i].callback;

      var link = document.createElement('a');
      link.title = actions[i].label;

      var icon = document.createElement('span');
      icon.setAttribute('role', 'button');
      icon.className = actions[i].icon;
      icon.innerHTML = actions[i].label;

      link.appendChild(icon);
      action.appendChild(link);
      formActions.appendChild(action);
    }
  };

  var resetForm = function() {
    formActions.innerHTML = '';
    currentContactId.value = '';
    givenName.value = '';
    familyName.value = '';
    var phones = document.getElementById('contacts-form-phones');
    var emails = document.getElementById('contacts-form-email');
    phones.innerHTML = '';
    emails.innerHTML = '';
    numberEmails = 0;
    numberPhones = 0;
  };

  var removeFieldIcon = function() {
    var delButton = document.createElement('button');
    delButton.className = 'fillflow-row-action';
    var delIcon = document.createElement('span');
    delIcon.setAttribute('role', 'button');
    delIcon.className = 'icon-delete';
    delButton.appendChild(delIcon);
    return delButton;
  };

  return {
    'showEdit' : showEdit,
    'showAdd': showAdd,
    'addNewPhone' : insertEmptyPhone,
    'addNewEmail' : insertEmptyEmail,
    'goBack' : navigation.back,
    'goToSelectTag': goToSelectTag
  };
})();

