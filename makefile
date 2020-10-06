install:
	npm install

publish:
	npm publish --dry-run

lint:
	npx eslint .

build:
	npx webpack

develop:
	npx webpack-dev-server --open
