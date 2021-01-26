"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _blacklistedEmails = _interopRequireDefault(
  require("./blacklisted-emails.json")
);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function isUndefined(value) {
  return value === undefined;
}

function fromSlug(string) {
  return string.replace(/[-_]/g, " ");
}

function ucFirst(string) {
  return string.replace(/^\w/g, (match) => match.toUpperCase());
}

var _default = {
  /*
   * Initialize Plugin
   */
  install(Vue, options = {}) {
    const { customRules } = options; // Create Mixin

    Vue.mixin({
      // Form Methods
      methods: {
        getFormValue(key, baseForm = null) {
          var _form$data, _form$data$key;

          const form =
            baseForm !== null && baseForm !== void 0 ? baseForm : this.form;
          return form === null || form === void 0
            ? void 0
            : (_form$data = form.data) === null || _form$data === void 0
            ? void 0
            : (_form$data$key = _form$data[key]) === null ||
              _form$data$key === void 0
            ? void 0
            : _form$data$key.value;
        },

        getFormData(baseForm = null) {
          const form =
            baseForm !== null && baseForm !== void 0 ? baseForm : this.form;
          const data = {};
          Object.keys(form.data).forEach((key) => {
            data[key] = form.data[key].value;
          });
          return data;
        },

        getFirstError(name, baseForm = null) {
          var _form$data$name;

          const form =
            baseForm !== null && baseForm !== void 0 ? baseForm : this.form;
          const errors =
            (_form$data$name = form.data[name]) === null ||
            _form$data$name === void 0
              ? void 0
              : _form$data$name.errors;

          if (!errors) {
            return null;
          }

          const firstErrorKey = Object.keys(errors)[0];
          return errors[firstErrorKey];
        },

        getFormError(baseForm = null) {
          var _form$error,
            _form$error2,
            _form$error2$response,
            _form$error2$response2,
            _form$error3,
            _form$error3$response,
            _form$error3$response2,
            _form$error4,
            _form$error4$response;

          const form =
            baseForm !== null && baseForm !== void 0 ? baseForm : this.form;

          if (!form.error) {
            return null;
          }

          if (
            (_form$error = form.error) !== null &&
            _form$error !== void 0 &&
            _form$error.toString().match(/Error: Network Error/i)
          ) {
            return "Please check your internet connection.";
          }

          if (
            (_form$error2 = form.error) !== null &&
            _form$error2 !== void 0 &&
            (_form$error2$response = _form$error2.response) !== null &&
            _form$error2$response !== void 0 &&
            (_form$error2$response2 = _form$error2$response.data) !== null &&
            _form$error2$response2 !== void 0 &&
            _form$error2$response2.message
          ) {
            return form.error.response.data.message;
          }

          const errors =
            (_form$error3 = form.error) === null || _form$error3 === void 0
              ? void 0
              : (_form$error3$response = _form$error3.response) === null ||
                _form$error3$response === void 0
              ? void 0
              : (_form$error3$response2 = _form$error3$response.data) ===
                  null || _form$error3$response2 === void 0
              ? void 0
              : _form$error3$response2.errors;

          if (errors && Object.keys(errors).length) {
            return "Please check the form for incorrect or missing data.";
          }

          switch (
            (_form$error4 = form.error) === null || _form$error4 === void 0
              ? void 0
              : (_form$error4$response = _form$error4.response) === null ||
                _form$error4$response === void 0
              ? void 0
              : _form$error4$response.status
          ) {
            case 412:
              return "You cannot perform this action.";

            default:
              // statements_def
              break;
          }

          if (form.error) {
            return form.error.message;
          }

          return "We seem to be experiencing server issues. Please try again later.";
        },

        mapFormErrors(form, errors = {}) {
          Object.keys(errors).forEach((key) => {
            if (form.data[key]) {
              // eslint-disable-next-line no-param-reassign
              form.data[key].errors = errors[key];
            }
          });
        },

        resetForm(baseForm = null) {
          const form =
            baseForm !== null && baseForm !== void 0 ? baseForm : this.form;
          const data = { ...form.baseState, baseState: form.baseState };
          return JSON.parse(JSON.stringify(data));
        },

        validateForm(form) {
          const { data, formElement } = form;
          const { length } = Object.keys(data);
          let validLength = 0;
          Object.keys(data).forEach((name) => {
            if (
              this.validateField(
                name,
                data[name],
                formElement && formElement.querySelector(`#${name}`),
                form
              )
            ) {
              validLength += 1;
            }
          });
          return length === validLength;
        },

        validateField(name, data, element, form) {
          const { value, rules } = data;
          let errors = false;
          let valid = true;
          const errorBag = {}; // If Rules are not provided

          if (!rules) {
            throw new Error("Invalid Validation Rules");
          }

          if (rules.constructor.toString().match(/Function/)) {
            valid = rules(value);

            if (valid === true) {
              errors = false;
              return true;
            } // Invalid Returns Error Message

            errors = [valid];
            return false;
          } // Split Rules

          rules.split("|").forEach((r) => {
            const rule = r.split(":");
            const ruleName = rule.shift();
            const params = rule.length ? rule.pop().split(",") : []; // Check If Rule Exists In Collection

            if (!this.$options.rules[ruleName]) {
              return;
            } // Get Rule From Collection

            const RULE = this.$options.rules[ruleName];
            let testArguments = [];
            let messageArguments = [];

            switch (ruleName) {
              case "required":
              case "email":
              case "privateEmail":
              case "alpha":
              case "number":
              case "alphaNum":
              case "alphaNumPunct":
              case "name":
              case "phone":
                testArguments = [value];
                messageArguments = [name];
                break;

              case "is":
              case "not":
              case "length":
                testArguments = [value, params[0]];
                messageArguments = [name, params[0]];
                break;

              case "min":
              case "max":
                testArguments = [value, params[0]];
                messageArguments = [name, params[0], value];
                break;

              case "inArray":
              case "notInArray":
                testArguments = [value, params];
                messageArguments = [name, params];
                break;

              case "requiredIf":
                testArguments = [];
                messageArguments = [];
                break;

              case "file":
                testArguments = [element];
                messageArguments = [name];
                break;

              case "size":
                testArguments = [];
                messageArguments = [];
                break;

              case "same":
                testArguments = [name, params[0], form];
                messageArguments = [name, params[0]];
                break;

              default:
                break;
            } // If Nullable Is Set And There is No Value, Validation Is Automatically Passed

            if (rules.match(/nullable/) && !value) {
              return;
            } // Populate Error Messages When Validation Fails

            if (!RULE.test(...testArguments)) {
              errorBag[ruleName] = RULE.message(...messageArguments);
              valid = false;
            }
          });

          if (valid) {
            errors = false;
          } else {
            errors = errorBag;
          } // eslint-disable-next-line no-param-reassign

          data.errors = errors;
          return valid;
        }
      },
      // Validation Rules
      rules: {
        nullable: {
          test() {
            return true;
          }
        },
        required: {
          test(data) {
            return data !== "" && data !== null && data !== undefined;
          },

          message() {
            return ucFirst("this field is required");
          }
        },
        requiredIf: {
          test(data, condition) {
            switch (condition) {
              case "is":
                break;

              default:
                break;
            }
          },

          message() {
            return ucFirst("this field is required");
          }
        },
        is: {
          test(data, value) {
            return data === value;
          },

          message(name, value) {
            return ucFirst(`this field must be ${value}`);
          },

          param: true
        },
        not: {
          test(data, value) {
            return data !== value;
          },

          message(name, value) {
            return ucFirst(`this field must NOT be ${value}`);
          },

          param: true
        },
        email: {
          test(data) {
            if (!data) {
              return true;
            }

            return (
              data &&
              data
                .toString()
                .match(
                  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                )
            );
          },

          message() {
            return ucFirst("this email is invalid");
          }
        },
        privateEmail: {
          test(data) {
            if (!data) {
              return true;
            }

            const publicEmails = _blacklistedEmails.default;
            return !publicEmails.find((email) =>
              new RegExp(`@${email}$`, "i").test(data)
            );
          },

          message() {
            return ucFirst("this email must be a private email");
          }
        },
        url: {
          test(data) {
            if (!data) {
              return true;
            }

            return data
              .toString()
              .match(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/);
          },

          message() {
            return ucFirst("this url is invalid");
          }
        },
        alpha: {
          test(data) {
            return data && data.toString().match(/^[a-z A-Z]+$/);
          },

          message() {
            return ucFirst("this field can only contain letters");
          }
        },
        number: {
          test(data) {
            return data && data.toString().match(/^[0-9]+$/);
          },

          message() {
            return ucFirst("this field can only contain numbers");
          }
        },
        alphaNum: {
          test(data) {
            return (
              data &&
              data.toString().match(/[a-zA-Z]+/) &&
              data.toString().match(/[0-9]+/)
            );
          },

          message() {
            return ucFirst("this field must contain letters and numbers");
          }
        },
        alphaNumPunct: {
          test(data) {
            return (
              data &&
              data.toString().match(/[a-zA-Z]+/) &&
              data.toString().match(/[0-9]+/) &&
              data.toString().match(/[!@#$%^&*()_+~`{}[\]\\;:'"<>,.?/]+/)
            );
          },

          message() {
            return ucFirst(
              "this field must contain letters, numbers and punctuations"
            );
          }
        },
        name: {
          test(data) {
            return data && data.toString().match(/\w{2}(\s\w{2})+/);
          },

          message(name) {
            return ucFirst(
              `the ${fromSlug(name)} has to be a proper full name`
            );
          }
        },
        phone: {
          test(data) {
            return (
              data && data.toString().match(/^(\+|)(234|0)(7|8|9)(0|1)\d{8}$/)
            );
          },

          message() {
            return ucFirst(
              "the phone number has to be a valid nigerian number"
            );
          }
        },
        min: {
          test(data, min) {
            if (!data) {
              return false;
            }

            if (typeof min !== "number" && Number.isNaN(min)) {
              throw new Error("rule parameter 'min' has to be a number");
            }

            if (typeof data === "number" || !Number.isNaN(data)) {
              return Number(data) >= min;
            }

            return data.toString().length >= min;
          },

          message(name, min, data) {
            if (typeof data === "number" || !Number.isNaN(data)) {
              return ucFirst(`this field has to be at least ${min}`);
            }

            return ucFirst(
              `this field has to contain at least ${min} characters`
            );
          },

          param: true,
          messageData: true
        },
        max: {
          test(data, max) {
            if (!data) {
              return false;
            }

            if (typeof max !== "number" && Number.isNaN(max)) {
              throw new Error("rule parameter 'max' has to be a number");
            }

            if (typeof data === "number" || !Number.isNaN(data)) {
              return Number(data) <= max;
            }

            return data.toString().length <= max;
          },

          message(name, max, data) {
            if (typeof data === "number" || !Number.isNaN(data)) {
              return ucFirst(`this field has to be less than ${max}`);
            }

            return ucFirst(
              `this field has to contain less than ${max} characters`
            );
          },

          param: true,
          messageData: true
        },
        length: {
          test(data, length) {
            if (!data) {
              return false;
            }

            if (typeof length === "number" && Number.isNaN(length)) {
              throw new Error("rule parameter 'length' has to be a number");
            }

            if (typeof data === "number") {
              return data === length;
            }

            return data.toString().length === length;
          },

          message(name, length) {
            return ucFirst(`this field has to be exactly ${length} characters`);
          },

          param: true
        },
        inArray: {
          test(data, array) {
            return data && array.find((item) => item === data);
          },

          message(name, array) {
            return ucFirst(
              `this field has to contain any of these ${array.join(", ")}`
            );
          },

          params: true
        },
        notInArray: {
          test(data, array) {
            return data && array.find((item) => item !== data);
          },

          message(name, array) {
            return ucFirst(
              `this field cannot contain any of these ${array.join(", ")}`
            );
          },

          params: true
        },
        file: {
          test(element) {
            return element && element.files && element.files.length;
          },

          message() {
            return ucFirst("a file has to be chosen for this field");
          },

          element: true
        },
        size: {
          test() {},

          message(name) {
            return ucFirst(`the file ${fromSlug(name)}`);
          }
        },
        same: {
          test(name1, name2, form) {
            var _form$data$name2, _form$data$name3;

            return (
              ((_form$data$name2 = form.data[name1]) === null ||
              _form$data$name2 === void 0
                ? void 0
                : _form$data$name2.value) ===
              ((_form$data$name3 = form.data[name2]) === null ||
              _form$data$name3 === void 0
                ? void 0
                : _form$data$name3.value)
            );
          },

          message(name1, name2) {
            return `the ${name1} field should the same as the ${name2} field`;
          },

          form: true
        },
        ...customRules
      },

      // Create Form Object
      basicForm(keys = [], extra = {}) {
        const form = {
          data: {},
          loading: false,
          success: false,
          error: false,

          setLoading(state = true) {
            this.loading = state;
          }
        };
        keys.forEach((key) => {
          let name = key;
          const value = "";
          const errors = false;
          const rules = "required";

          switch (key === null || key === void 0 ? void 0 : key.constructor) {
            case String:
              form.data[name] = {
                value,
                errors,
                rules
              };
              break;

            case Object:
              name = !isUndefined(key.name) ? key.name : name;
              form.data[name] = {
                ...key,
                value: !isUndefined(key.value) ? key.value : value,
                errors: !isUndefined(key.errors) ? key.errors : errors,
                rules: !isUndefined(key.rules) ? key.rules : rules
              };
              break;

            default:
              // statements_def
              break;
          }
        });
        Object.keys(extra).forEach((prop) => {
          form[prop] = extra[prop];
        });
        form.baseState = JSON.parse(JSON.stringify(form));
        return form;
      },

      // Watch For Changes
      basicWatchers(context, formPath = "form", formElement) {
        var _context$formPath;

        const keys =
          (_context$formPath = context[formPath]) === null ||
          _context$formPath === void 0
            ? void 0
            : _context$formPath.data;
        const form = formPath
          .split(".")
          .reduce((last, current) => last[current], context);
        Object.keys(keys).forEach((key) => {
          const watcher = `${formPath}.data.${key}.value`;
          const data = form.data[key];
          const element = formElement && formElement.querySelector(`#${key}`);
          context.$watch(watcher, () => {
            context.validateField(key, data, element, form);
          });
        });
      }
    });
  }
};
exports.default = _default;
