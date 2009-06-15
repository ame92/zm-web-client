<%--
 * ***** BEGIN LICENSE BLOCK *****
 * 
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2008, 2009 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * 
 * ***** END LICENSE BLOCK *****
--%>
<%@ tag body-content="empty" dynamic-attributes="dynattrs" %>
<%@ attribute name="mailbox" rtexprvalue="true" required="true" type="com.zimbra.cs.taglib.bean.ZMailboxBean" %>
<%@ attribute name="urlTarget" rtexprvalue="true" required="true" %>
<%@ attribute name="context" rtexprvalue="true" required="true" type="com.zimbra.cs.taglib.tag.SearchContext" %><%@ attribute name="isTop" rtexprvalue="true" required="false" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="com.zimbra.i18n" %>
<%@ taglib prefix="app" uri="com.zimbra.htmlclient" %>
<%@ taglib prefix="zm" uri="com.zimbra.zm" %>
<c:set var="top_stb" value="${param.top_stb eq '0' ? '0' : (empty sessionScope.top_stb ? '1' : sessionScope.top_stb)}"/>
<c:set var="btm_stb" value="${param.btm_stb eq '0' ? '0' : (empty sessionScope.btm_stb ? '1' : sessionScope.btm_stb)}"/>

<c:set var="top_tb" value="${param.top_tb eq '0' ? '0' : (empty sessionScope.top_tb ? '1' : sessionScope.top_tb)}"/>
<c:set var="btm_tb" value="${param.btm_tb eq '0' ? '0' : (empty sessionScope.btm_tb ? '1' : sessionScope.btm_tb)}"/>

<c:set var="top_fldr_select" value="${param.top_fldr_select eq '1' ? '1' : (empty sessionScope.top_fldr_select ? '0' : sessionScope.top_fldr_select)}"/> <%-- Default disabled--%>
<c:set var="btm_fldr_select" value="${param.btm_fldr_select eq '0' ? '0' : (empty sessionScope.btm_fldr_select ? '1' : sessionScope.btm_fldr_select)}"/> <%-- Default enabled--%>
<%--<c:if test="${not empty requestScope.statusMessage && isTop}"> --%><%-- For search query errors --%><%--
    <div class="${requestScope.statusClass}">${fn:escapeXml(requestScope.statusMessage)} </div>
</c:if>--%>
<c:if test="${isTop && '1' eq  top_stb}">
    <div class="SubToolbar table">
        <div class="table-row">
            <div class="table-cell">
                        <a accesskey="${requestScope.navlink_accesskey}" href="${urlTarget}?st=${context.isWikiSearch || context.folder.isWikiView || context.folder.types eq 'wiki' ? 'notebooks':'briefcases'}"><fmt:message
                                key="${context.isWikiSearch || context.folder.isWikiView || context.folder.types eq 'wiki' ? 'notebooks':'briefcases'}"/></a> &laquo;
                        <c:if test="${top_fldr_select eq '0'}">
                            ${fn:escapeXml(zm:truncateFixed(context.shortBackTo,12,true))}
                        </c:if>
                        <c:if test="${top_fldr_select ne '0'}">
			<select class="_zo_select_button" name="sfi"
                                onchange="fetchIt('?sfi='+this.value+'&amp;st=${context.st}');">
                            <zm:forEachFolder var="fldr" skiproot="true">
                                <c:if test="${(context.isBriefcaseSearch && fldr.isDocumentView && !context.folder.isWikiView && context.folder.types ne 'wiki') || ((context.isWikiSearch || context.folder.isWikiView || context.folder.types eq 'wiki') && fldr.isWikiView )}">
                                    <option ${param.sfi eq fldr.id || context.folder.id eq fldr.id ? 'selected="selected"' : ''}
                                            value="${fldr.id}">${fn:escapeXml(zm:truncateFixed(zm:getFolderName(pageContext,fldr.id),15,true))}
                                    </option>
                                </c:if>
                            </zm:forEachFolder>
                        </select>
                        </c:if>
                <c:if test="${not empty param.sq && context.searchResult.size > 0}">
                &laquo; <a href="?saveSearch=1&sq=${param.sq}&search=0"  onclick='toggleElem("searchbar",this); return toggleElem("savesearchbar",this);'><fmt:message key="saveSearch"/></a>
                </c:if>    
            </div>
        </div>
    </div>
</c:if>
<c:if test="${((isTop && '1' eq  top_tb ) || (!isTop && '1' eq btm_tb))}">
<div class="Toolbar table">
<div class="table-row">
<span class="table-cell">
<span class="zo_button_group">
<c:choose>
    <c:when test="${context.searchResult.hasPrevPage}">
        <zm:prevResultUrl var="url" value="${urlTarget}" index="0" context="${context}" _pv="1"/>
        <a accesskey="${requestScope.prev_accesskey}" href="${fn:escapeXml(url)}" class='zo_button prev_button'>
            <!--&#9668;--><fmt:message key="MO_PREV"/>
        </a>
    </c:when>
    <c:otherwise>
        <a class='zo_button_disabled prev_button'>
            <!--&#9668;--><fmt:message key="MO_PREV"/>
        </a>
    </c:otherwise>
</c:choose>
<c:choose>
    <c:when test="${context.searchResult.hasNextPage}">
        <zm:nextResultUrl var="url" value="${urlTarget}" index="0" context="${context}"/>
        <a accesskey="${requestScope.next_accesskey}" class='zo_button next_button' href="${fn:escapeXml(url)}">
           <!-- &nbsp;&#9658;--><fmt:message key="MO_NEXT"/>
        </a>
    </c:when>
    <c:otherwise>
        <a class='zo_button_disabled next_button'>
           <!-- &#9658;--><fmt:message key="MO_NEXT"/>
        </a>
    </c:otherwise>
</c:choose>
</span>
<!--</span>
<span class="table-cell">-->
<c:if test="${context.searchResult.size gt 0}">
    <span>
        <select class="zo_select_button" name="anAction" onchange="submitForm(document.getElementById('zForm'),null,this.value)">
            <option value="" selected="selected"><fmt:message key="moreActions"/></option>
                <%--<optgroup label="<fmt:message key="delete"/>">--%>
            <c:choose>
                <c:when test="${not context.folder.isInTrash}">
                    <option value="actionDelete"><fmt:message key="delete"/></option>
                </c:when>
                <c:otherwise>
                    <option value="actionHardDelete"><fmt:message key="delete"/></option>
                </c:otherwise>
            </c:choose>
            <optgroup label="<fmt:message key="view"/>">
                <option value="actionViewList"><fmt:message key="MO_viewList"/></option>
                <option value="actionViewExplorer"><fmt:message key="MO_viewExplorer"/></option>
            </optgroup>
            <option value="actionAttachToCompose"><fmt:message key="sendAsAttachments"/></option>
            <!--</optgroup>-->
            <optgroup label="<fmt:message key='select'/>">
                <option value="selectAll"><fmt:message key="all"/></option>
                <option value="selectNone"><fmt:message key="none"/></option>
            </optgroup>
            <optgroup label="<fmt:message key="moveAction"/>">
            <zm:forEachFolder var="folder">
                <c:if test="${(context.isBriefcaseSearch and !context.folder.isWikiView and context.folder.types ne 'wiki' and folder.id != context.folder.id and folder.isDocumentMoveTarget) or ((context.isWikiSearch || context.folder.isWikiView || context.folder.types eq 'wiki') and  folder.id != context.folder.id and folder.isWikiView) and !folder.isTrash and !folder.isSpam}">
                    <option value="moveTo_${folder.id}">${fn:escapeXml(folder.rootRelativePath)}</option>
                </c:if>
            </zm:forEachFolder>
            </optgroup>
            <c:if test="${mailbox.features.tagging and mailbox.hasTags}">
                <c:set var="allTags" value="${mailbox.mailbox.allTags}"/>
                <optgroup label="<fmt:message key="MO_actionAddTag"/>">
                    <c:forEach var="atag" items="${allTags}">
                        <option value="addTag_${atag.id}">${fn:escapeXml(atag.name)}</option>
                    </c:forEach>
                </optgroup>
                <optgroup label="<fmt:message key="MO_actionRemoveTag"/>">
                    <c:forEach var="atag" items="${allTags}">
                        <option value="remTag_${atag.id}">${fn:escapeXml(atag.name)}</option>
                    </c:forEach>
                </optgroup>
            </c:if>
        </select>
        <noscript><input id="actGo${isTop}" class="zo_button" name="moreActions" type="submit" value="<fmt:message key="actionGo"/>"/></noscript>
    <script type="text/javascript">var actGo = document.getElementById('actGo${isTop}');if(actGo){actGo.style.display='none';}</script>
    </span>
</c:if>
<!--</span>
<span class="table-cell">-->
<span class=" f-right">
<c:choose>
<c:when test="${context.isWikiSearch && ! empty context.sfi && !context.folder.isSearchFolder}">
    <a class="zo_button" accesskey="${requestScope.mainaction_accesskey}" href="${context_url}?st=briefcase&sfi=${context.sfi}"><fmt:message key="MO_files"/></a>
</c:when>
<c:when test="${context.folder.isWikiView || context.folder.types eq 'wiki' && !context.folder.isSearchFolder}">
    <a class="zo_button" href="${context_url}?st=wiki&sfi=${context.sfi}"><fmt:message key="MO_pages"/></a>
</c:when>
</c:choose>
</span>
</span>
</div>
</div>
</c:if>
<c:if test="${!isTop && '1' eq  btm_stb }"> <%-- no_btm_stb => no bottom sub toolbar, set this param to disable bottom subtoolbar --%>
    <div class="SubToolbar table">
        <div class="table-row">
            <div class="table-cell">
                        <a accesskey="${requestScope.navlink_accesskey}" href="${urlTarget}?st=${context.isWikiSearch || context.folder.isWikiView || context.folder.types eq 'wiki' ? 'notebooks':'briefcases'}"><fmt:message
                                key="${context.isWikiSearch || context.folder.isWikiView || context.folder.types eq 'wiki' ? 'notebooks' : 'briefcases'}"/></a> &laquo;
                        <c:if test="${btm_fldr_select eq '0'}">
                            ${fn:escapeXml(zm:truncateFixed(context.shortBackTo,12,true))}
                        </c:if>
                        <c:if test="${btm_fldr_select ne '0'}">
			<select class="_zo_select_button" name="sfi"
                                onchange="fetchIt('?sfi='+this.value+'&amp;st=${context.st}');">
                            <zm:forEachFolder var="fldr" skiproot="true">
                                <c:if test="${(context.isBriefcaseSearch && fldr.isDocumentView && !context.folder.isWikiView && context.folder.types ne 'wiki') || ((context.isWikiSearch || context.folder.isWikiView || context.folder.types eq 'wiki') && fldr.isWikiView )}">
                                    <option ${param.sfi eq fldr.id || context.folder.id eq fldr.id ? 'selected="selected"' : ''}
                                            value="${fldr.id}">${fn:escapeXml(zm:truncateFixed(zm:getFolderName(pageContext,fldr.id),15,true))}
                                    </option>
                                </c:if>
                            </zm:forEachFolder>
                        </select>
                        </c:if>
            </div>
        </div>
    </div>
</c:if>
<input type="hidden" name="isInTrash" value="${context.folder.isInTrash}">
    