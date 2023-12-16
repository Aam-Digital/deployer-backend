<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Elementor form Aam Digital deploy action.
 *
 * Custom Elementor form action which allows to deploy a new Aam Digital instance.
 *
 * @since 1.0.0
 */
class AamDeploy extends \ElementorPro\Modules\Forms\Classes\Action_Base {

	/**
	 * Get action name.
	 *
	 * Retrieve action name.
	 *
	 * @since 1.0.0
	 * @access public
	 * @return string
	 */
	public function get_name() {
		return 'aam-deploy';
	}

	/**
	 * Get action label.
	 *
	 * Retrieve action label.
	 *
	 * @since 1.0.0
	 * @access public
	 * @return string
	 */
	public function get_label() {
		return esc_html__( 'Aam Digital deploy', 'elementor-forms-aam-deploy' );
	}

	/**
	 * Run action.
	 *
	 * Submit the data to 
	 *
	 * @since 1.0.0
	 * @access public
	 * @param \ElementorPro\Modules\Forms\Classes\Form_Record  $record
	 * @param \ElementorPro\Modules\Forms\Classes\Ajax_Handler $ajax_handler
	 */
	public function run( $record, $ajax_handler ) {
		$settings = $record->get( 'form_settings' );

		// Get submitted form data.
		$raw_fields = $record->get( 'fields' );

		// Normalize form data.
		$fields = [];
		foreach ( $raw_fields as $id => $field ) {
			$fields[ $id ] = $field['value'];
		}

		$res = wp_remote_post(
			$settings['remote-url'],
			[
				'method' => 'POST',
				'headers' => [
					'Content-Type' => 'application/json',
				],
				'body' => wp_json_encode([
					'name' => $fields['name'],
					'username' => $fields['username'],
					'email' => $fields['email'],
					'monitor' => $settings['monitor'] ? True : False,
					'backend' => $settings['backend'] ? True : False,
					'client' => $settings['client'],
					'clientKey' => $settings['client-key'],
					'base' => $settings['base'],
					'locale' => $settings['locale'],
				]),
				'httpversion' => '1.0',
				'timeout' => 60,
			]
		);

        if ( is_wp_error( $res ) || $res['response']['code'] >= 400 ) {
            // $res['body'] is a stringified JSON
            // Checkout the interactive setup script and the deployer backend for possible errors
            if ( str_contains( $res['body'] , 'name already exists' ) ) {
                $ajax_handler->add_error( 'name', $settings['msg_name_exists'] );
            } elseif ( str_contains( $res['body'] , 'Only letters, numbers and dashes are allowed in name' ) ) {
                $ajax_handler->add_error( 'name', $settings['msg_format_invalid'] );
            } elseif ( str_contains( $res['body'] , 'Only letters, numbers and dashes are allowed in username' ) ) {
                $ajax_handler->add_error( 'username', $settings['msg_format_invalid'] );
            } elseif ( str_contains( $res['body'] , 'Not a valid email' ) ) {
                $ajax_handler->add_error( 'email', $settings['msg_invalid_email'] );
            } else {
                $ajax_handler->add_error_message( $settings['msg_other_error'] );
            }
			return False;
        }
	}

	/**
	 * Register action controls.
	 *
	 * These hold sensitive information.
	 *
	 * @since 1.0.0
	 * @access public
	 * @param \Elementor\Widget_Base $widget
	 */
	public function register_settings_section( $widget ) {
		$widget->start_controls_section(
			'section_aam_deploy',
			[
				'label' => esc_html__( 'Aam Digital deploy', 'elementor-forms-aam-deploy' ),
				'condition' => [
					'submit_actions' => $this->get_name(),
				],
			]
		);

		$widget->add_control(
			'remote-url',
			[
				'label' => esc_html__( 'Remote URL', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'placeholder' => 'https://deploy.aam-digital.com/deploy',
				'description' => esc_html__( 'Enter the URL where the deployment server is running.', 'elementor-forms-aam-deploy' ),
			]
		);

		$widget->add_control(
			'client',
			[
				'label' => esc_html__( 'Client name', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'description' => esc_html__( 'Enter your client name.', 'elementor-forms-aam-deploy' ),
			]
		);

		$widget->add_control(
			'client-key',
			[
				'label' => esc_html__( 'Client key', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'description' => esc_html__( 'Enter your secret client key (API token).', 'elementor-forms-aam-deploy' ),
			]
		);

		$widget->add_control(
			'locale',
			[
				'label' => esc_html__( 'Language', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'description' => esc_html__( 'Enter the default language for the deployed app ("en", "de", ...).', 'elementor-forms-aam-deploy' ),
				'default' => 'en',
			]
		);

		$widget->add_control(
			'base',
			[
				'label' => esc_html__( 'Base', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'description' => esc_html__( 'Enter the configuration which should be the basis.', 'elementor-forms-aam-deploy' ),
			]
		);

		$widget->add_control(
			'backend',
			[
				'label' => esc_html__( 'Add permissions backend', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::SWITCHER,
				'description' => esc_html__( 'Allows to define permissions.', 'elementor-forms-aam-deploy' ),
			]
		);

		$widget->add_control(
			'monitor',
			[
				'label' => esc_html__( 'Add monitoring', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::SWITCHER,
				'description' => esc_html__( 'Adds uptime monitoring for the deployment.', 'elementor-forms-aam-deploy' ),
			]
		);

		$widget->add_control(
			'msg_name_exists',
			[
				'label' => esc_html__( 'Name already exists Error', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Name already exists.',
			]
		);

		$widget->add_control(
			'msg_format_invalid',
			[
				'label' => esc_html__( 'Invalid format Error', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Only letters, numbers and dashes are allowed.',
			]
		);

		$widget->add_control(
			'msg_invalid_email',
			[
				'label' => esc_html__( 'Invalid email Error', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Not a valid email format.',
			]
		);

		$widget->add_control(
			'msg_other_error',
			[
				'label' => esc_html__( 'Other Error', 'elementor-forms-aam-deploy' ),
				'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Server error. Please contact system administrator.',
			]
		);

		$widget->end_controls_section();
	}

	/**
	 * On export.
	 *
	 * Remove sensitive information.
	 *
	 * @since 1.0.0
	 * @access public
	 * @param array $element
	 */
	public function on_export( $element ) {
	    unset(
            $element['client-key'],
        );

        return $element;
    }
}
