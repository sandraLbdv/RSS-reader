install:
	npm install

start:
	npx babel src --out-dir dist

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	npx jest

test-coverage:
	npx jest --coverage