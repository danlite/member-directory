Members = new Meteor.Collection('members');

var presentEditModal = function () {
  $('#edit').modal().off('hidden').on('hidden', function () {
    Session.set('selected_member', null);
  });
};

var sessionSelectedMemberID = function () {
  var member = Session.get('selected_member');
  return member && member._id;
};

var iconNameForPhoneType = function (type) {
  switch (type) {
      case 'home':
        return 'home';
      case 'work':
        return 'building';
      case 'cell':
        return 'mobile-phone';
    }
};

var defaultPhone = function () {
  return { type: 'home', uuid: Random.id() };
}

if (Meteor.isClient) {

  Meteor.startup(function () {
    Meteor.autorun(function () {
      $('#stylesheet').attr('href', Session.get('print') ? '/booklet.css' : '/directory.css');
    });

    if (Session.get('selected_member')) {
      presentEditModal();
    }
  });

  Meteor.Router.add({
    '/': 'directory',
    '/print': 'print'
  });

  Meteor.Router.beforeRouting = function (context) {
    Session.set('print', (context.path == '/print'));
  };

  Handlebars.registerHelper('print', function () {
    return Session.get('print');
  })

  Handlebars.registerHelper('stringIfExists', function (value) {
    return value ? value : '';
  });

  Handlebars.registerHelper('phoneIcon', function (type) {
    var i = $('<i>').addClass('icon-li icon-fixed-width'),
        iconName;

    iconName = iconNameForPhoneType(type);

    if (iconName) {
      i.addClass('icon-' + iconName);
      return i.prop('outerHTML');
    }

    return '';
  });

  Template.nav_bar.events({
    'click #add-member': function () {
      Session.set('selected_member', {});
      presentEditModal();
    },

    'click #print-preview': function () {
      Meteor.Router.to('/print');
    }
  });

  Template.print.events({
    'click #edit-directory': function () {
      Meteor.Router.to('/');
    },

    'click #print-page': function () {
      window.print();
    }
  });

  Template.member_list.members = function (){
    return Members.find({}, { sort: { family_name: 1, given_names: 1 }});
  };
  Template.member_list_print.members = Template.member_list.members;

  Template.member.full_name = function () {
    if (!this.family_name) {
      return this.given_names || '';
    }

    if (!this.given_names) {
      return this.family_name;
    }

    return this.family_name + ", " + this.given_names;
  };
  Template.member_print.full_name = Template.member.full_name;

  Template.member.hidden = function () {
    return this.hidden ? 'member-hidden' : '';
  };
  Template.member_print.hidden = Template.member.hidden;

  Template.member.editing = function () {
    return sessionSelectedMemberID() == this._id ? 'warning' : '';
  };

  Template.member.events({
    'click': function (event, template) {
      Session.set('selected_member', template.data);
      presentEditModal();
    }
  });

  Template.edit_member.action = function () {
    return sessionSelectedMemberID() ? 'Edit' : 'Add';
  }

  Template.edit_member.selected_member = function () {
    return Session.get('selected_member');
  }

  Template.edit_member.hidden = function () {
    return Session.get('selected_member').hidden ? 'checked' : '';
  };

  Template.edit_member.phone_with_uuid = function () {
    this.uuid = Random.id();
    return this;
  }

  Template.edit_member.events({
    'submit form': function () {
      var form = _.extend({ phones: [] }, $('#edit form').serializeObject());

      var m = Session.get('selected_member');
      var callback = function (error) {
        if (!error) {
          $('#edit').modal('hide')
        }
      };

      if (m._id) {
        Members.update(m._id, {$set: form}, callback);
      } else {
        form._id = Members.insert(form, callback);
      }

      return false;
    },

    'click #add-phone': function () {
      var newField = Meteor.render(function () {
        return Template.phone_field(defaultPhone());
      });
      $('#edit-phones').append(newField);

      return false;
    },

    'click .remove.btn': function (event) {
      $(event.target).closest('fieldset.phone').remove();

      return false;
    }
  });

  Template.phone_field.events({
    'click li.phone-type-item': function (event) {
      var id = this.uuid,
          item = $(event.target).closest('.phone-type-item'),
          type = item.data('type');

      $('input#phone-type-' + id).val(type);

      $('#phone-type-button-' + id).html(Meteor.render(Template.phone_type_button_content({ type: type })));
    }
  });

  Template.phone_type_button_content.phone_icon_class = function () {
    var name = iconNameForPhoneType(this.type);
    return name ? 'icon-' + name : '';
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}