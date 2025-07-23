import js from "@eslint/js";
import globals from "globals";

export default [
  // Base configuration for all JavaScript files
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // Add common web APIs and globals used in your project
        pydio: "readonly",
        PydioApi: "readonly",
        Swal: "readonly",
        Papa: "readonly",
        Chart: "readonly",
        SparkMD5: "readonly",
        // Web Workers globals
        self: "readonly",
        importScripts: "readonly",
        postMessage: "readonly",
        // Webpack globals
        process: "readonly",
      }
    },
    rules: {
      // Extend the recommended rules
      ...js.configs.recommended.rules,
      
      // Code Quality Rules
      "no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true 
      }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // Best Practices
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "curly": ["error", "all"],
      "default-case": "warn",
      "no-fallthrough": "error",
      "no-multi-spaces": "error",
      "no-trailing-spaces": "error",
      "no-whitespace-before-property": "error",
      "space-before-blocks": "error",
      "space-in-parens": "error",
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "comma-spacing": ["error", { before: false, after: true }],
      "key-spacing": ["error", { beforeColon: false, afterColon: true }],
      
      // Modern JavaScript
      "prefer-const": "error",
      "no-var": "error",
      "prefer-arrow-callback": "warn",
      "arrow-spacing": "error",
      "prefer-template": "warn",
      "template-curly-spacing": "error",
      "no-useless-concat": "error",
      
      // ES6+ Features
      "prefer-destructuring": ["warn", {
        array: false,
        object: true
      }],
      "object-shorthand": "warn",
      "prefer-spread": "warn",
      "prefer-rest-params": "warn",
      
      // Import/Export
      "no-duplicate-imports": "error",
      
      // Error Prevention
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-extra-boolean-cast": "error",
      "no-regex-spaces": "error",
      "valid-typeof": "error",
      
      // Style Consistency
      "indent": ["error", 2, { 
        SwitchCase: 1,
        ignoredNodes: ["TemplateLiteral"]
      }],
      "quotes": ["error", "double", { 
        avoidEscape: true,
        allowTemplateLiterals: true 
      }],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      
      // Function Rules
      "no-empty-function": ["warn", { allow: ["constructors"] }],
      "consistent-return": "warn",
      
      // Variable Rules
      "no-shadow": "warn",
      "no-use-before-define": ["error", { 
        functions: false, 
        classes: true, 
        variables: true 
      }],
      
      // Performance
      "no-inner-declarations": "error",
      "no-loop-func": "warn",
    }
  },
  
  // Configuration for Node.js files (webpack config, etc.)
  {
    files: ["webpack.config.js", "*.config.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
      }
    },
    rules: {
      "no-console": "off", // Allow console in config files
    }
  },
  
  // Configuration for Web Workers
  {
    files: ["**/*.worker.js", "**/workers/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.worker,
        self: "readonly",
        importScripts: "readonly",
        postMessage: "readonly",
        onmessage: "writable",
        onerror: "writable",
      }
    },
    rules: {
      "no-console": "off", // Workers might need console for debugging
    }
  },
  
  // Relaxed rules for deprecated files
  {
    files: ["**/deprecated/**/*.js"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "no-undef": "warn", // Downgrade to warning for deprecated code
      "prefer-const": "off",
      "no-var": "off",
    }
  },
  
  // Configuration for Web Components and Lit
  {
    files: ["**/web-components/**/*.js", "**/*element*.js", "**/*component*.js"],
    rules: {
      // Web Components often use these patterns
      "no-unused-expressions": ["error", { 
        allowShortCircuit: true, 
        allowTernary: true,
        allowTaggedTemplates: true 
      }],
      // Lit templates often have complex expressions
      "max-len": ["warn", { 
        code: 120, 
        ignoreTemplateLiterals: true,
        ignoreStrings: true 
      }],
    }
  },
  
  // Global ignores
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".webpack-cache/**",
      "*.min.js",
      "coverage/**",
    ]
  }
];
