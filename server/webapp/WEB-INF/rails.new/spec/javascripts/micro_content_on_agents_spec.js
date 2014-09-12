/*************************GO-LICENSE-START*********************************
 * Copyright 2014 ThoughtWorks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *************************GO-LICENSE-END**********************************/

describe("micro_content_on_agents", function () {
    var resources_widget = null;
    var resources_widget_shower = null;
    var environment_widget = null;
    var environment_widget_shower = null;
    var resource_popup_handler = null;
    var util_load_page_fn = null;
    var xhr = null;

    function resource_validator(value) {
        return /.*?X.*/.test(value);
    }

    Event.observe(window, 'load', function () {
        resource_popup_handler = new EditPopupHandler.AddEditHandler('http://foo/bar', $('agents_form'), Util.are_any_rows_selected('.agents .agent_select'), resource_validator, 'agent_edit_operation', 'Apply_Resource', 'Add_Resource');
        resources_widget = new MicroContentPopup($('resources_panel'), resource_popup_handler);
        resources_widget_shower = new MicroContentPopup.ClickShower(resources_widget);
        resources_widget_shower.bindShowButton($('show_resources_panel'));
        resource_popup_handler.setDefaultText($$('.new_resource')[0], "my default text");

        environment_widget = new MicroContentPopup($('environments_panel'), new EditPopupHandler.AddOnlyHandler('http://foo/baz', $('agents_form'), Util.are_any_rows_selected('.agents .agent_select')));
        environment_widget_shower = new MicroContentPopup.ClickShower(environment_widget);
        environment_widget_shower.bindShowButton($('show_environments_panel'));
    });

    var actual_ajax_updater = Ajax.Updater;
    var actual_ajax_request = jQuery.ajax;

    var actual_periodical_updater = Ajax.PeriodicalUpdater;

    var response_pane;
    var resource_selection_url;
    var resource_selection_request_option;

    var periodical_opts = null;
    var header = null, content = null;
    var ajax_request_for_tri_state_boxes_fired = false;
    var otherAjax = null;

    var replicator = null;
    var replicated_checkbox_parents = ['ajax_agents_table', 'actual_agent_selectors'];
    var replicated_checkbox_id_reader = function (chk_bx) {
        return chk_bx.value;
    };

    beforeEach(function () {
        setFixtures("<div class='under_test'>\n" +
            "  <div class='page_header' style=\"overflow:inherit;\">\n" +
            "      <h1 class='entity_title'>Agents</h1>\n" +
            "        <div class='filter_agents'>\n" +
            "            <form action='/agents' id='agents_filter_form' method='get'>\n" +
            "          <div id='filter_help' class='enhanced_dropdown hidden'>\n" +
            "              <div class='filter_help_instructions'>\n" +
            "                    <p class='heading'>Available tags</p>\n" +
            "                    <div>\n" +
            "                        <p>name:</p>\n" +
            "                        <p>os:</p>\n" +
            "                        <p>ip:</p>\n" +
            "                        <p>status:</p>\n" +
            "                        <p>resource:</p>\n" +
            "                        <p>environment:</p>\n" +
            "                    </div>\n" +
            "                    <p class='heading'>Values</p>\n" +
            "                    <div>\n" +
            "                        <p>Put filter values in quotes for exact match</p>\n" +
            "                    </div>\n" +
            "                  <p><a class='' href='/go/help/agents_page.html#filter_agents' target='_blank'>More...</a></p>\n" +
            "              </div>\n" +
            "          </div>\n" +
            "          <input id='filter_text' name='filter' placeholder='tag: value' type='text'/>\n" +
            "          <button type='submit' class='submit primary'>Filter</button>\n" +
            "                <a href='/agents?filter=' class='link_as_button' id='clear_filter'>Clear</a>\n" +
            "                </form>\n" +
            "        </div>\n" +
            "\n" +
            "      <div class='edit_panel' id='dd_ajax_float' style=\"float:right;\">\n" +
            "\n" +
            "      <form action='/agents/edit_agents' id='agents_form' method='post'>\n" +
            "      <input id=\"agent_edit_operation\" type=\"hidden\" name=\"operation\" />\n" +
            "      <div style='display: none' id='actual_agent_selectors'>\n" +
            "          <input type='checkbox' name='selected[]' value='UUID_host1' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='uuid4' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='uuid3' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='UUID_host4' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='UUID_host5' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='UUID_host6' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='UUID_host7' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='UUID_host8' class='agent_select'/>\n" +
            "          <input type='checkbox' name='selected[]' value='UUID_host9' class='agent_select'/>\n" +
            "      </div>\n" +
            "      <button class='submit' id=\"UUID\" name='Enable' type='submit' value='Enable'><span>ENABLE</span></button>\n" +
            "      <script type='text/javascript'>\n" +
            "          Util.on_load(function() { Event.observe($('UUID'), 'click',\n" +
            "                  function(evt) { Util.set_value('agent_edit_operation', 'Enable')(evt); });\n" +
            "          });\n" +
            "      </script>\n" +
            "      <button class='submit' id=\"UUID\" name='Disable' type='submit' value='Disable'><span>DISABLE</span></button>\n" +
            "      <script type='text/javascript'>\n" +
            "        Util.on_load(function() { Event.observe($('UUID'), 'click',\n" +
            "                function(evt) { Util.set_value('agent_edit_operation', 'Disable')(evt); });\n" +
            "        });\n" +
            "      </script>\n" +
            "      <button class='submit' id=\"UUID\" name='Delete' type='submit' value='Delete'><span>DELETE</span></button>\n" +
            "      <script type='text/javascript'>\n" +
            "          Util.on_load(function() { Event.observe($('UUID'), 'click',\n" +
            "                  function(evt) { Util.set_value('agent_edit_operation', 'Delete')(evt); });\n" +
            "          });\n" +
            "      </script>\n" +
            "      <button class='show_panel select submit button' id='show_resources_panel' text_color='dark' type='button' value='Resources'>\n" +
            "          <span>RESOURCES<img src='/images/g9/button_select_icon_dark.png?N/A'></img></span>\n" +
            "      </button>\n" +
            "      <div id='resources_panel' class='hidden resources_panel agent_edit_popup enhanced_dropdown'>\n" +
            "        <div class='resources_selector scrollable_panel'>\n" +
            "          <div class='loading'></div>\n" +
            "        </div>\n" +
            "        <div class='add_panel hidden'>\n" +
            "          <input type='text' name='add_resource' class='new_resource new_field'/>\n" +
            "         <button class=\"apply_resources apply_button submit_small primary submit\" name=\"resource_operation\" type=\"submit\" value=\"Add\">\n" +
            "             <span>ADD</span>\n" +
            "         </button>\n" +
            "          <div class=\"validation_message error hidden\">Invalid character. Please use a-z, A-Z, 0-9, fullstop, underscore, hyphen and pipe.</div>\n" +
            "        </div>\n" +
            "        <div class='no_selection_error error hidden'>Please select one or more agents first.</div>\n" +
            "      </div>\n" +
            "      <button class='show_panel select submit button' id='show_environments_panel' text_color='dark' type='button' value='Environments'>\n" +
            "          <span>ENVIRONMENTS<img src='/images/g9/button_select_icon_dark.png?N/A'></img></span>\n" +
            "      </button>\n" +
            "      <div id='environments_panel' class='hidden environments_panel agent_edit_popup enhanced_dropdown'>\n" +
            "        <div class='environments_selector scrollable_panel'>\n" +
            "          <div class='loading'></div>\n" +
            "        </div>\n" +
            "        <div class='add_panel hidden'>\n" +
            "          <button class=\"submit_small primary apply_button submit\" id=\"1e9de87d-55ac-4ac1-9bdd-93ff8725821e\" name=\"Apply\" type=\"submit\" value=\"Apply\">\n" +
            "              <span>APPLY</span>\n" +
            "          </button>\n" +
            "            <script type='text/javascript'>\n" +
            "                Util.on_load(function() { Event.observe($('1e9de87d-55ac-4ac1-9bdd-93ff8725821e'), 'click',\n" +
            "                        function(evt) { Util.set_value('agent_edit_operation', 'Apply_Environment')(evt); });\n" +
            "                });\n" +
            "            </script>\n" +
            "        </div>\n" +
            "        <div class='no_selection_error error hidden'>Please select one or more agents first.</div>\n" +
            "        <div class='no_environments_error error hidden'>No environments are defined.</div>\n" +
            "      </div>\n" +
            "      </form>\n" +
            "      </div>\n" +
            "  </div>\n" +
            "  <div class='content_wrapper_outer'> <div class='content_wrapper_inner'>\n" +
            "  <div id='agents_form_container'>\n" +
            "        <div id='ajax_agents_header' class='clear_float'>\n" +
            "          <ul class='agent_counts list_aggregation clear_float'>\n" +
            "              <li class='pending'>Pending: </li>\n" +
            "              <li class='enabled'>Enabled: </li>\n" +
            "              <li class='disabled'>Disabled: </li>\n" +
            "          </ul>\n" +
            "    </div>\n" +
            "   </div>\n" +
            "    <div id='ajax_agents_table' class='agents_table'>\n" +
            "      <table id='agent_details' class='agents list_table sortable_table selectable_table'>\n" +
            "      <thead>\n" +
            "        <tr class='agent_header'>\n" +
            "          <th class=\"selector\">\n" +
            "                <input class='agent_select' id='select_all_agents' name='accept' type='checkbox' value=''/>\n" +
            "            </th>\n" +
            "          <th class='hostname'>\n" +
            "            <a href='/agents?column=hostname&amp;order=ASC'>\n" +
            "              <span>Agent Name</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "          <th class='location'>\n" +
            "            <a href='/agents?column=location&amp;order=ASC'>\n" +
            "              <span>Sandbox</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "          <th class='operating_system'>\n" +
            "            <a href='/agents?column=operating_system&amp;order=ASC'>\n" +
            "              <span>OS</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "          <th class='ip_address'>\n" +
            "            <a href='/agents?column=ip_address&amp;order=ASC'>\n" +
            "              <span>IP Address</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "          <th class='status'>\n" +
            "            <a href='/agents?column=status&amp;order=ASC'>\n" +
            "              <span>Status</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "          <th class='usable_space'>\n" +
            "            <a href='/agents?column=usable_space&amp;order=ASC'>\n" +
            "              <span>Free Space</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "          <th class='resources'>\n" +
            "            <a href='/agents?column=resources&amp;order=ASC'>\n" +
            "              <span>Resources</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "          <th class='environments'>\n" +
            "            <a href='/agents?column=environments&amp;order=ASC'>\n" +
            "              <span>Environments</span>\n" +
            "            </a>\n" +
            "          </th>\n" +
            "        </tr>\n" +
            "        </thead>\n" +
            "      <tbody>\n" +
            "        <tr class='agent_instance Idle' id='UUID_host1'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='UUID_host1' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='host1'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/UUID_host1\">host1</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title='Linux'>\n" +
            "            <span>Linux</span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='10.18.5.1'>\n" +
            "            <span>10.18.5.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='idle'>\n" +
            "            <span>idle</span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='10.0 KB'>\n" +
            "            <span>10.0 KB</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='no resources specified'>\n" +
            "            <span>no resources specified</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance Pending' id='uuid4'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='uuid4' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='CCeDev03'>\n" +
            "            <span class=\"agent_hostname\">CCeDev03</span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title='linux'>\n" +
            "            <span>linux</span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='127.0.0.1'>\n" +
            "            <span>127.0.0.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='pending'>\n" +
            "            <span>pending</span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='0 bytes'>\n" +
            "            <span>0 bytes</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='no resources specified'>\n" +
            "            <span>no resources specified</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance Idle' id='uuid3'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='uuid3' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='CCeDev01'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/uuid3\">CCeDev01</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title='linux'>\n" +
            "            <span>linux</span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='10.6.6.6'>\n" +
            "            <span>10.6.6.6</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='idle'>\n" +
            "            <span>idle</span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='10.0 GB'>\n" +
            "            <span>10.0 GB</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='db | dbSync'>\n" +
            "            <span>db | dbSync</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance Building' id='UUID_host4'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='UUID_host4' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='CCeDev01'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/UUID_host4\">CCeDev01</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title='Linux'>\n" +
            "            <span>Linux</span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='10.18.5.1'>\n" +
            "            <span>10.18.5.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='blue/2/stage/3/job/'>\n" +
            "            <span>\n" +
            "              <a href='/go/tab/build/detail/blue/2/stage/3/job/'>building</a>\n" +
            "            </span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='0 bytes'>\n" +
            "            <span>0 bytes</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='java'>\n" +
            "            <span>java</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance Idle' id='UUID_host5'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='UUID_host5' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='foo_baz_host'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/UUID_host5\">foo_baz_host</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title='Windows'>\n" +
            "            <span>Windows</span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='10.18.5.1'>\n" +
            "            <span>10.18.5.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='idle'>\n" +
            "            <span>idle</span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='12.0 GB'>\n" +
            "            <span>12.0 GB</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='nant | vs.net'>\n" +
            "            <span>nant | vs.net</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance Missing' id='UUID_host6'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='UUID_host6' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='foo_bar_host'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/UUID_host6\">foo_bar_host</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title=''>\n" +
            "            <span></span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='192.168.0.1'>\n" +
            "            <span>192.168.0.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='missing'>\n" +
            "            <span>missing</span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='Unknown'>\n" +
            "            <span>Unknown</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='no resources specified'>\n" +
            "            <span>no resources specified</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='uat | blah'>\n" +
            "            <span>uat | blah</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance Cancelled' id='UUID_host7'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='UUID_host7' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='CCeDev01'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/UUID_host7\">CCeDev01</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title='Linux'>\n" +
            "            <span>Linux</span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='10.18.5.1'>\n" +
            "            <span>10.18.5.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='pink/2/stage/3/job/'>\n" +
            "            <span>\n" +
            "              <a href='/go/tab/build/detail/pink/2/stage/3/job/'>building (cancelled)</a>\n" +
            "            </span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='0 bytes'>\n" +
            "            <span>0 bytes</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='no resources specified'>\n" +
            "            <span>no resources specified</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance LostContact' id='UUID_host8'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='UUID_host8' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='localhost'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/UUID_host8\">localhost</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title=''>\n" +
            "            <span></span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='192.168.0.1'>\n" +
            "            <span>192.168.0.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='lost contact at REPLACED_DATE while building french/2/stage/3/job/: job rescheduled'>\n" +
            "            <span>\n" +
            "              <a href='/go/tab/build/detail/french/2/stage/3/job/'>lost contact</a>\n" +
            "            </span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='Unknown'>\n" +
            "            <span>Unknown</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='no resources specified'>\n" +
            "            <span>no resources specified</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "        <tr class='agent_instance LostContact' id='UUID_host9'>\n" +
            "          <td class='selector'>\n" +
            "            <input type='checkbox' name='selected[]' value='UUID_host9' class='agent_select'/>\n" +
            "          </td>\n" +
            "          <td class='hostname' title='localhost'>\n" +
            "            <span class=\"agent_hostname\"><a href=\"/agents/UUID_host9\">localhost</a></span>\n" +
            "          </td>\n" +
            "          <td class='location' title='LOCATION'>\n" +
            "            <span>LOCATION</span>\n" +
            "          </td>\n" +
            "          <td class='operating_system' title=''>\n" +
            "            <span></span>\n" +
            "          </td>\n" +
            "          <td class='ip_address' title='192.168.0.1'>\n" +
            "            <span>192.168.0.1</span>\n" +
            "          </td>\n" +
            "          <td class='status' title='lost contact at REPLACED_DATE'>\n" +
            "            <span>lost contact</span>\n" +
            "          </td>\n" +
            "          <td class='usable_space' title='Unknown'>\n" +
            "            <span>Unknown</span>\n" +
            "          </td>\n" +
            "          <td class='resources' title='no resources specified'>\n" +
            "            <span>no resources specified</span>\n" +
            "          </td>\n" +
            "          <td class='environments' title='no environments specified'>\n" +
            "            <span>no environments specified</span>\n" +
            "          </td>\n" +
            "        </tr>\n" +
            "      </tbody>\n" +
            "      </table>\n" +
            "    </div>\n" +
            "  </div>\n" +
            "  </div>\n" +
            "</div>");
    });

    beforeEach(function () {
        ajax_request_for_tri_state_boxes_fired = false;
        Ajax.Updater = function (container, url, options) {
            response_pane = container;
            resource_selection_url = url;
            resource_selection_request_option = options;
            ajax_request_for_tri_state_boxes_fired = true;
        };

        jQuery.ajax = function (options) {
            periodical_opts = options;
        };
        AjaxRefreshers.addRefresher(otherAjax = {stopRefresh: function () {
            this.stopped = true;
        }, restartRefresh: function () {
            this.started = true;
        }});
        fire_event($(document.body), 'click');
        header = $('ajax_agents_header').innerHTML;
        content = $('ajax_agents_table').innerHTML;
        $$('.new_resource.new_field').each(function (input) {
            input.value = "my default text";
        });

        replicator = new FieldStateReplicator();

        for (var i = 0; i < replicated_checkbox_parents.length; i++) {
            replicator.register_all_matching($(replicated_checkbox_parents[i]), '.agent_select', replicated_checkbox_id_reader);
        }
        util_load_page_fn = Util.loadPage;
        Util.loadPage = function (url) {
            newPageUrl = url;
        };
        xhr = {
            getResponseHeader: function (name) {
                return "holy_cow_new_url_is_sooooo_cool!!!";
            }
        };
    });

    afterEach(function () {
        Util.loadPage = util_load_page_fn;
        replicator.unregister_all();
        Ajax.Updater = actual_ajax_updater;
        Ajax.PeriodicalUpdater = actual_periodical_updater;
        jQuery.ajax = actual_ajax_request;
        AjaxRefreshers.clear();
        $$('.agent_select').each(function (check_box) {
            check_box.checked = false;
        });
        $('ajax_agents_header').innerHTML = header;
        $('ajax_agents_table').innerHTML = content;
        $$("#uuid3 .selector input").checked = false;
    });

    it("test_looks_up_resource_panel_given_a_child_element", function () {
        var env_handler = MicroContentPopup.lookupHandler($$('.no_environments_error')[0]);
        assertTrue(environment_widget.callback_handler == env_handler);
        var resource_handler = MicroContentPopup.lookupHandler($$('.new_resource')[0]);
        assertTrue(resources_widget.callback_handler == resource_handler);
        var no_handler = MicroContentPopup.lookupHandler($('agents_form'));
        assertEquals("must return null when no parent popup can be found", null, no_handler);
    });

    it("test_validates_new_resource_using_passed_in_validator_function", function () {
        fire_event($("show_resources_panel"), 'click');
        var new_field = $$('.new_resource.new_field')[0];
        new_field.value = "foo";
        fire_event(new_field, 'keyup');
        assertFalse("validation message should have been shown for invalid new value", $$('.validation_message')[0].hasClassName('hidden'));
        new_field.value = "bXr";
        fire_event(new_field, 'keyup');
        assertTrue("validation message should NOT have been shown for valid new value", $$('.validation_message')[0].hasClassName('hidden'));
    });

    xit("should_still_show_popup_when_no_add_field_registered", function () {
        fire_event($("show_environments_panel"), 'click');
        assertFalse("environment panel should be shown", $('environments_panel').hasClassName('hidden'));
        fire_event($(document.body), 'click');
        assertTrue("environment panel should be hidden", $('environments_panel').hasClassName('hidden'));
    });

    it("test_should_toggle_popup_visibility_when_clicked_on_show_button", function () {
        fire_event($("show_environments_panel"), 'click');
        assertFalse("environment panel should be shown", $('environments_panel').hasClassName('hidden'));
        fire_event($("show_environments_panel"), 'click');
        assertTrue("environment panel should NOT be shown", $('environments_panel').hasClassName('hidden'));
        fire_event($("show_environments_panel"), 'click');
        assertFalse("environment panel should be shown", $('environments_panel').hasClassName('hidden'));
    });

    it("test_closes_other_popups_on_show", function () {
        fire_event($("show_environments_panel"), 'click');
        fire_event($("show_resources_panel"), 'click');
        assertFalse("resource panel should be visible", $('resources_panel').hasClassName('hidden'));
        assertTrue("environment panel should be hidden", $('environments_panel').hasClassName('hidden'));
    });

    it("test_should_not_show_resource_popup_by_default", function () {
        assertEquals("resources_panel should not be visible.", true, $("resources_panel").hasClassName('hidden'));
    });

    it("test_should_have_loading_when_page_loaded_or_when_resource_panel_is_opened", function () {
        var chk_box = jQuery('#ajax_agents_table .agent_select').get(1);
        chk_box.checked = true;
        fire_event(chk_box, 'change');
        var selector_pane = $$('.resources_selector').first();
        assertEquals('loading', jQuery(selector_pane.innerHTML).select('div')[0].className);
        selector_pane.innerHTML = "foo";
        fire_event($("show_resources_panel"), 'click');
        assertEquals('loading', jQuery(selector_pane.innerHTML).select('div')[0].className);
        assertEquals("resources_panel should be visible.", false, $("resources_panel").hasClassName('hidden'));
    });

    it("test_should_hide_resource_popup_when_anything_outside_of_the_popup_is_clicked", function () {
        var show_button = $("show_resources_panel");
        fire_event(show_button, 'click');
        fire_event($(document.body), 'click');
        assertTrue("resources_panel should NOT be visible.", $("resources_panel").hasClassName('hidden'));
    });

    it("test_should_NOT_hide_resource_popup_when_anything_inside_the_popup_is_clicked", function () {
        var show_button = $("show_resources_panel");
        fire_event(show_button, 'click');
        fire_event($$('.new_resource').first(), 'click');
        assertFalse("resources_panel should be visible.", $("resources_panel").hasClassName('hidden'));
    });


    it("test_not_should_show_error_message_if_resource_is_ok", function () {
        var show_button = $("show_resources_panel");
        fire_event(show_button, 'click');
        $("resources_panel").getElementsBySelector("input[type='text']")[0].setValue("foo");
        assertEquals(true, $($("resources_panel").getElementsBySelector(".validation_message")[0]).hasClassName('hidden'));
    });

    it("test_shows_NO_AGENTS_SELECTED_message", function () {
        var add_panel = $("resources_panel").getElementsBySelector('.add_panel')[0];
        var edit_panel = $("resources_panel").getElementsBySelector('.scrollable_panel')[0];
        var no_agents_message = $("resources_panel").getElementsBySelector('.no_selection_error')[0];
        var selector_pane = $$('.resources_selector').first();
        selector_pane.innerHTML = "foo";// was dirty
        var show_button = $("show_resources_panel");
        fire_event(show_button, 'click');
        assertTrue("add panel should not be shown", add_panel.hasClassName('hidden'));
        assertTrue("edit panel should not be shown", edit_panel.hasClassName('hidden'));
        assertFalse("no agents selected message should be shown", no_agents_message.hasClassName('hidden'));
        assertFalse("ajax request should not have been fired when no agents are selected", ajax_request_for_tri_state_boxes_fired);


        fire_event(show_button, 'click'); //hide
        $(document.body).getElementsBySelector("input[type='checkbox']").each(function (checkbox) {
            checkbox.checked = true;
        });
        fire_event(show_button, 'click'); //show again
        assertFalse("add panel should be shown", add_panel.hasClassName('hidden'));
        assertFalse("edit panel should be shown", edit_panel.hasClassName('hidden'));
        assertTrue("no agents selected message should not be shown", no_agents_message.hasClassName('hidden'));
        assertTrue("ajax request should have been fired when no agents are selected", ajax_request_for_tri_state_boxes_fired);
    });

    it("test_should_fire_ajax_request_to_load_resource_selection_list", function () {
        var agent_check_box = jQuery('#ajax_agents_table .agent_select').get(1);
        agent_check_box.checked = true;
        fire_event(agent_check_box, 'change');
        var show_button = $("show_resources_panel");
        fire_event(show_button, 'click');
        assertTrue(response_pane.hasClassName('resources_selector'));
        assertTrue("ajax request for loading tristate boxes should have been fired", ajax_request_for_tri_state_boxes_fired);
        assertTrue("should stop other ajax request", otherAjax.stopped);
        assertEquals("http://foo/bar", resource_selection_url);
        assertEquals(true, resource_selection_request_option['evalScripts']);
        assertEquals('UUID_host1', resource_selection_request_option['parameters']['selected[]']);
    });

    it("test_switches_to_add_mode_on_show", function () {
        $$('.agent_select')[0].checked = true;
        var show_button = $("show_resources_panel");
        fire_event(show_button, 'click');
        resource_popup_handler.tristate_clicked();
        fire_event(show_button, 'click');//hide it
        fire_event(show_button, 'click');
        var new_field = $$(".new_resource")[0];
        var apply_resources_button = $$(".apply_resources")[0];
        assertFalse("add resource field should be shown on re-show", new_field.hasClassName('hidden'));
        assertEquals("has add button on re-show", "Add", apply_resources_button.value);
    });

    it("test_update_page", function () {
        var refresher = new AgentsAjaxRefresher('http://blah/refresh', "foo", replicator, replicated_checkbox_parents, replicated_checkbox_id_reader, 0);
        AjaxRefreshers.addRefresher(refresher);
        refresher.stopRefresh();
        refresher.restartRefresh();

        periodical_opts.success({ajax_agents_header: {html: "counts"}, ajax_agents_table: {html: "tablecontent"}});
        periodical_opts.complete(xhr);
        assertEquals("counts", $('ajax_agents_header').innerHTML);
        assertEquals("tablecontent", $('ajax_agents_table').innerHTML);
    });

    it("test_update_page_keeps_the_current_selections", function () {
        var table = $("ajax_agents_table").innerHTML;
        var chkbox = jQuery("#uuid3 .selector input")[0];

        var refresher = new AgentsAjaxRefresher('http://blah/refresh', "foo", replicator, replicated_checkbox_parents, replicated_checkbox_id_reader, 0);
        refresher.stopRefresh();
        refresher.restartRefresh();

        chkbox.checked = true;
        fire_event(chkbox, 'change');
        periodical_opts.success({ajax_agents_header: {html: "counts"}, ajax_agents_table: {html: table}});
        periodical_opts.complete(xhr);
        assertTrue(jQuery("#uuid3 .selector input")[0].checked);
    });

    it("test_agent_resource_name_validator", function () {
        assertTrue(AgentUtil.validate_resource_name('foo-bar.baz|quux'));
        assertFalse(AgentUtil.validate_resource_name('foo$bar'));
    });

    it("test_add_should_clear_default_text_model", function () {
        resource_popup_handler = new EditPopupHandler.AddEditHandler('http://foo/bar', $('agents_form'), Util.are_any_rows_selected('.agents .agent_select'), resource_validator, 'agent_edit_operation', 'Apply_Resource', 'Add_Resource');
        resources_widget = new MicroContentPopup($('resources_panel'), resource_popup_handler);
        resource_popup_handler.setDefaultText($$('.new_resource')[0], "my default text");
        var form = $('agents_form');
        var new_resource_value = null;
        var apply_resource_button = $$(".apply_resources")[0];
        fire_event(apply_resource_button, "click");
        new_resource_value = form.serialize();
        assertEquals(1, new_resource_value.match(/\badd_resource=(?:$|&)/).length);
    });

    it("test_understand_modify_mode", function () {
        var show_button = $("show_resources_panel");
        fire_event(show_button, 'click');
        var new_field = $$(".new_resource")[0];
        var apply_resources_button = $$(".apply_resources")[0];
        assertFalse("add resource field should be shown on load", new_field.hasClassName('hidden'));
        assertEquals("operation should be add resource", "Add_Resource", $('agent_edit_operation').value);
        resource_popup_handler.tristate_clicked();
        fire_event(apply_resources_button, "click");
        assertEquals("operation should be apply resource", "Apply_Resource", $('agent_edit_operation').value);
        assertTrue("add resource field should not be shown in modified mode", new_field.hasClassName('hidden'));

    });

    it("test_should_show_error_when_there_are_no_environments", function () {
        $$("#UUID_host5 .selector input").first().checked = true;
        fire_event($("show_environments_panel"), 'click');
        resource_selection_request_option.onComplete(xhr);
        assertTrue($$("#environments_panel .add_panel")[0].hasClassName("hidden"));
        assertFalse($$("#environments_panel .no_environments_error")[0].hasClassName("hidden"));
    });

    it("test_should_show_error_when_there_are_environments", function () {
        Ajax.Updater = function (container, url, options) {
            container.update("<div class='selectors'>checkboxes here</div>");
            options.onComplete(xhr);
        };
        $$("#UUID_host5 .selector input").first().checked = true;
        fire_event($("show_environments_panel"), 'click');
        assertFalse($$("#environments_panel .add_panel")[0].hasClassName("hidden"));
        assertTrue($$("#environments_panel .no_environments_error")[0].hasClassName("hidden"));
    });

    it("test_should_call_after_close_callback_handler", function () {
        var called = false;
        var handler = new MicroContentPopup.NoOpHandler();
        handler.after_close = function () {
            called = true;
        }
        var microContentPopup = new MicroContentPopup($('resources_panel'), handler);
        var microContentPopupShower = new MicroContentPopup.ClickShower(microContentPopup);
        var showButton = $('show_resources_panel');
        microContentPopupShower.bindShowButton(showButton);
        fire_event(showButton, "click")
        microContentPopup.close()
        assertTrue(called);
    });
});
