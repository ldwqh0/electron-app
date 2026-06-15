import pluginN from "eslint-plugin-n";
import pluginPromise from "eslint-plugin-promise";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import { defineConfig } from "eslint/config";
import { standardRules } from "./eslint/standard-rules.mjs";
import importX from "eslint-plugin-import-x";
import tslint from "typescript-eslint";

console.log(process.env.NODE_ENV);

const standard = {
  plugins: {
    n: pluginN,
    promise: pluginPromise,
    "import-x": importX
  },
  rules: {
    ...standardRules,
    "no-undef": "error",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off"
  },
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: {
      ...globals.browser,
      env: true
    }
  }
};

export default defineConfig(
  {
    files: ["src/**/*.js", "src/**/*.mjs", "src/**/*.cjs"],
    ...standard
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    extends: [
      standard,
      ...tslint.configs.recommended
    ]
  },
  {
    files: ["src/**/*.vue"],
    extends: [
      standard,
      ...tslint.configs.recommended,
      pluginVue.configs["flat/strongly-recommended"]
    ],
    languageOptions: {
      parserOptions: {
        parser: tslint.parser
      },
      globals: {
        env: true,
        ...globals.browser
      }
    },
    rules: {
      indent: "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "vue/script-indent": ["error", 2, {
        baseIndent: 1,
        switchCase: 1
      }],
      "vue/multi-word-component-names": "off",
      "vue/first-attribute-linebreak": ["error", {
        singleline: "ignore",
        multiline: "beside"
      }],
      "vue/max-attributes-per-line": ["error", {
        singleline: {
          max: 3
        },
        multiline: {
          max: 1
        }
      }],
      "vue/singleline-html-element-content-newline": "off",
      // 是否在html标记中添加空格
      "vue/html-closing-bracket-spacing": [
        "error", {
          startTag: "never",
          endTag: "never",
          selfClosingTag: "always"
        }],
      "vue/html-closing-bracket-newline": [
        "error", {
          singleline: "never",
          multiline: "never"
        }],
      // 'vue/html-indent': ['error'],
      // 'vue/no-multi-spaces': ['error'],
      // 'vue/mustache-interpolation-spacing': ['error'],
      // 使用kebab-case模式的组件规则
      "vue/component-name-in-template-casing": [
        "error", "kebab-case", {
          ignores: []
        }
      ]
    }
  }
);
