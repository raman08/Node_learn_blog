/* eslint-disable no-undef */
const authMiddleWare = require('../middleware/isAuth');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

describe('Auth MiddleWare', () => {
	it('Should throw error if authentication header not found', () => {
		const req = {
			get: () => {
				return null;
			},
		};

		expect(authMiddleWare.bind(this, req, {}, () => {})).to.throw(
			'[ERROR] User Not authenticated'
		);
	});

	it('Should throw error if authorization token is one string', () => {
		const req = {
			get: () => {
				return 'abcdefgh';
			},
		};

		expect(authMiddleWare.bind(this, req, {}, () => {})).to.throw();
	});
	it('Should return userId if valid token is pass', () => {
		const req = {
			get: () => {
				return 'abcdefgh';
			},
		};

		sinon.stub(jwt, 'verify');
		jwt.verify.returns({ userId: 'abcdef' });

		authMiddleWare(req, {}, () => {});
		expect(req).has.property('userId');
		jwt.verify.restore();
	});

	it('Should throw error if invalid token is pass', () => {
		const req = {
			get: () => {
				return 'AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQRRSSTTUUVVWWXXYYZZ';
			},
		};

		expect(authMiddleWare.bind(this, req, {}, () => {})).to.throw();
	});
});
