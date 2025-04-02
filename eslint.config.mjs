import pluginTypescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import pluginN from "eslint-plugin-n";
import pluginPromise from "eslint-plugin-promise";
import pluginImport from "eslint-plugin-import";
import globals from "globals";

import standardConfig from "eslint-config-standard";

const standard = {
  plugins: {
    "import": pluginImport,
    n: pluginN,
    promise: pluginPromise
  },
  rules: {
    ...standardConfig.rules,
    "no-undef": "error",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off"
  },
  languageOptions: {
    ecmaVersion: "latest",
    globals: {
      ...globals.browser
    }
  }
};
const typescriptRules = {
  ...pluginTypescript.configs.recommended.rules,
  "@typescript-eslint/indent": ["error", 2],
  // '@typescript-eslint/member-delimiter-style': ['error', {
  //   singleline: {
  //     delimiter: 'comma',
  //     requireLast: false
  //   },
  //   multiline: {
  //     delimiter: 'none',
  //     requireLast: true
  //   }
  // }],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/explicit-function-return-type": ["error", {
    allowExpressions: true,
    allowTypedFunctionExpressions: true,
    allowHigherOrderFunctions: false,
    allowDirectConstAssertionInArrowFunctions: false,
    allowConciseArrowFunctionExpressionsStartingWithVoid: false,
    allowFunctionsWithoutTypeParameters: false
  }]
};
export default [{
  files: ["src/**/*.js", "src/**/*.mjs", "src/**/*.cjs"],
  ...standard
}, {
  files: ["src/**/*.ts"],
  plugins: {
    ...standard.plugins,
    "@typescript-eslint": pluginTypescript
  },
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parser: typescriptParser,
    globals: {
      ...globals.browser,
      process: true,
      env: true
    }
  },
  rules: {
    ...standard.rules,
    ...typescriptRules,
    "indent": "off"
  }
},
  ...pluginVue.configs["flat/strongly-recommended"],
  {
    files: ["src/**/*.vue"],
    plugins: {
      ...standard.plugins,
      "@typescript-eslint": pluginTypescript,
      vue: pluginVue
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: vueParser,
      parserOptions: {
        parser: "@typescript-eslint/parser"
      },
      globals: {
        ...globals.browser,
        env: true
      }
    },
    rules: {
      ...standard.rules,
      ...typescriptRules,
      "indent": "off",
      "@typescript-eslint/indent": "off",
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
  }];
