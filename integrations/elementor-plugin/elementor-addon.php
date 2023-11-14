<?php
/**
 * Plugin Name: Elementor Forms Aam Digital deploy
 * Description: Custom addon which will deploy a new Aam Digital instance.
 * Plugin URI:  https://aam-digital.com
 * Version:     1.0.0
 * Author:      Aam Digital GmbH
 * Author URI:  https://aam-digital.com
 * Text Domain: elementor-forms-aam-deploy
 *
 * Elementor tested up to: 3.16.0
 * Elementor Pro tested up to: 3.16.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Add new form action after form submission.
 *
 * @since 1.0.0
 * @param ElementorPro\Modules\Forms\Registrars\Form_Actions_Registrar $form_actions_registrar
 * @return void
 */
function add_new_deploy_action( $form_actions_registrar ) {

	include_once( __DIR__ .  '/form-actions/aam-deploy.php' );

	$form_actions_registrar->register( new \AamDeploy() );

}
add_action( 'elementor_pro/forms/actions/register', 'add_new_deploy_action' );