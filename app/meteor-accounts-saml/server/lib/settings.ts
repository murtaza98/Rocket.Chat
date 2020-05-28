import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../../settings';
import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
import { SAMLUtils } from './Utils';
import { Logger } from '../../../logger/server';

const logger = new Logger('steffo:meteor-accounts-saml', {
	methods: {
		updated: {
			type: 'info',
		},
	},
});

// Settings are created on the addSamlService method

export const getSamlConfigs = function(service): Record<string, any> {
	return {
		buttonLabelText: settings.get(`${ service.key }_button_label_text`),
		buttonLabelColor: settings.get(`${ service.key }_button_label_color`),
		buttonColor: settings.get(`${ service.key }_button_color`),
		clientConfig: {
			provider: settings.get(`${ service.key }_provider`),
		},
		entryPoint: settings.get(`${ service.key }_entry_point`),
		idpSLORedirectURL: settings.get(`${ service.key }_idp_slo_redirect_url`),
		usernameNormalize: settings.get(`${ service.key }_username_normalize`),
		immutableProperty: settings.get(`${ service.key }_immutable_property`),
		generateUsername: settings.get(`${ service.key }_generate_username`),
		debug: settings.get(`${ service.key }_debug`),
		nameOverwrite: settings.get(`${ service.key }_name_overwrite`),
		mailOverwrite: settings.get(`${ service.key }_mail_overwrite`),
		issuer: settings.get(`${ service.key }_issuer`),
		logoutBehaviour: settings.get(`${ service.key }_logout_behaviour`),
		customAuthnContext: settings.get(`${ service.key }_custom_authn_context`),
		authnContextComparison: settings.get(`${ service.key }_authn_context_comparison`),
		defaultUserRole: settings.get(`${ service.key }_default_user_role`),
		roleAttributeName: settings.get(`${ service.key }_role_attribute_name`),
		roleAttributeSync: settings.get(`${ service.key }_role_attribute_sync`),
		secret: {
			privateKey: settings.get(`${ service.key }_private_key`),
			publicCert: settings.get(`${ service.key }_public_cert`),
			// People often overlook the instruction to remove the header and footer of the certificate on this specific setting, so let's do it for them.
			cert: SAMLUtils.normalizeCert(settings.get(`${ service.key }_cert`) || ''),
		},
		signatureValidationType: settings.get(`${ service.key }_signature_validation_type`),
		userDataFieldMap: settings.get(`${ service.key }_user_data_fieldmap`),
		allowedClockDrift: settings.get(`${ service.key }_allowed_clock_drift`),
		identifierFormat: settings.get(`${ service.key }_identifier_format`),
		nameIDPolicyTemplate: settings.get(`${ service.key }_NameId_template`),
		authnContextTemplate: settings.get(`${ service.key }_AuthnContext_template`),
		authRequestTemplate: settings.get(`${ service.key }_AuthRequest_template`),
		logoutResponseTemplate: settings.get(`${ service.key }_LogoutResponse_template`),
		logoutRequestTemplate: settings.get(`${ service.key }_LogoutRequest_template`),
	};
};

export const configureSamlService = function(samlConfigs: Record<string, any>): IServiceProviderOptions {
	let privateCert = false;
	let privateKey = false;

	if (samlConfigs.secret.privateKey && samlConfigs.secret.publicCert) {
		privateKey = samlConfigs.secret.privateKey;
		privateCert = samlConfigs.secret.publicCert;
	} else if (samlConfigs.secret.privateKey || samlConfigs.secret.publicCert) {
		logger.error('You must specify both cert and key files.');
	}

	SAMLUtils.updateGlobalSettings(samlConfigs);

	return {
		provider: samlConfigs.clientConfig.provider,
		entryPoint: samlConfigs.entryPoint,
		idpSLORedirectURL: samlConfigs.idpSLORedirectURL,
		issuer: samlConfigs.issuer,
		cert: samlConfigs.secret.cert,
		privateCert,
		privateKey,
		customAuthnContext: samlConfigs.customAuthnContext,
		authnContextComparison: samlConfigs.authnContextComparison,
		defaultUserRole: samlConfigs.defaultUserRole,
		roleAttributeName: samlConfigs.roleAttributeName,
		roleAttributeSync: samlConfigs.roleAttributeSync,
		allowedClockDrift: parseInt(samlConfigs.allowedClockDrift) || 0,
		signatureValidationType: samlConfigs.signatureValidationType,
		identifierFormat: samlConfigs.identifierFormat,
		nameIDPolicyTemplate: samlConfigs.nameIDPolicyTemplate,
		authnContextTemplate: samlConfigs.authnContextTemplate,
		authRequestTemplate: samlConfigs.authRequestTemplate,
		logoutResponseTemplate: samlConfigs.logoutResponseTemplate,
		logoutRequestTemplate: samlConfigs.logoutRequestTemplate,
		callbackUrl: Meteor.absoluteUrl(`_saml/validate/${ samlConfigs.clientConfig.provider }`),
	};
};

export const loadSamlServiceProviders = function(): void {
	const serviceName = 'saml';
	const services = settings.get(/^(SAML_Custom_)[a-z]+$/i);

	const providers = services.map((service) => {
		if (service.value === true) {
			const samlConfigs = getSamlConfigs(service);
			logger.updated(service.key);
			ServiceConfiguration.configurations.upsert({
				service: serviceName.toLowerCase(),
			}, {
				$set: samlConfigs,
			});
			return configureSamlService(samlConfigs);
		}
		return ServiceConfiguration.configurations.remove({
			service: serviceName.toLowerCase(),
		});
	}).filter((e) => e);

	SAMLUtils.setServiceProvidersList(providers);
};
