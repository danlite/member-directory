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

if (Meteor.isClient) {

  Handlebars.registerHelper('stringIfExists', function (value) {
    return value ? value : '';
  });

  Meteor.startup(function () {
    if (Session.get('selected_member')) {
      presentEditModal();
    }
  });

  Template.nav_bar.events({
    'click #add-member': function () {
      Session.set('selected_member', {});
      presentEditModal();
    }
  });

  Template.member_list.members = function (){
    return Members.find({}, { sort: { family_name: 1, given_names: 1 }});
  };

  Template.member.full_name = function () {
    if (!this.family_name) {
      return this.given_names || '';
    }

    if (!this.given_names) {
      return this.family_name;
    }

    return this.family_name + ", " + this.given_names;
  };

  Template.member.phoneIcon = function () {
    var i = $('<i>').addClass('icon-li'),
        iconName;

    switch (this.type) {
      case 'home':
        iconName = 'home'; break;
      case 'work':
        iconName = 'building'; break;
      case 'cell':
        iconName = 'mobile-phone'; break;
    }

    if (iconName) {
      i.addClass('icon-' + iconName);
      return i.prop('outerHTML');
    }

    return '';
  };

  Template.member.hidden = function () {
    return this.hidden ? 'member_hidden' : '';
  };

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
      $('#edit-phones').append(Meteor.render(Template.phone_field()));

      return false;
    },

    'click .remove.btn': function (event) {
      $(event.target).closest('.input-append').remove();

      return false;
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}